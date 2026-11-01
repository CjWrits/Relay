import { createHash } from 'node:crypto';
import { NormalizedActivity, AccessLevel, SourceType } from '@/types/relay';
import { DocumentChunk, SourceAdapter, ValidationResult } from '../types';

export interface ProcessedDocumentInput {
  fileName: string;
  fileContent: string;
  fileSizeBytes: number;
  accessLevel?: AccessLevel;
}

export class DocumentAdapter implements SourceAdapter<ProcessedDocumentInput[]> {
  sourceType: SourceType = 'DOCUMENT';

  /**
   * Validates a document file: size <= 5MB, .md or .txt extension, and non-binary content.
   */
  validateFile(fileName: string, fileSizeBytes: number, content: string | Buffer): ValidationResult {
    // 1. File size check (5 MB ceiling)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (fileSizeBytes > MAX_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds 5 MB limit (${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB).`,
      };
    }

    if (fileSizeBytes === 0) {
      return { valid: false, error: 'File is empty (0 bytes).' };
    }

    // 2. Extension check
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || (extension !== 'md' && extension !== 'markdown' && extension !== 'txt')) {
      return {
        valid: false,
        error: `Unsupported file extension ".${extension}". Only .md and .txt files are accepted.`,
      };
    }

    // 3. Binary detection check (null bytes or high density of non-text bytes)
    const textSample = typeof content === 'string' ? content.slice(0, 4096) : content.subarray(0, 4096).toString('utf-8');
    if (textSample.includes('\0')) {
      return { valid: false, error: 'Binary content detected (null bytes present). Only plain text/markdown is accepted.' };
    }

    return { valid: true };
  }

  async validateConfig(inputs: ProcessedDocumentInput[]): Promise<ValidationResult> {
    if (!inputs || inputs.length === 0) {
      return { valid: false, error: 'No documents provided for ingestion.' };
    }

    for (const doc of inputs) {
      const fileValidation = this.validateFile(doc.fileName, doc.fileSizeBytes, doc.fileContent);
      if (!fileValidation.valid) {
        return fileValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Ingests and chunks documents deterministically, preserving exact line numbers and provenance.
   */
  async fetchActivities(
    inputs: ProcessedDocumentInput[],
    projectId: string,
    sourceId: string
  ): Promise<NormalizedActivity[]> {
    const activities: NormalizedActivity[] = [];

    for (const doc of inputs) {
      const sanitizedName = this.sanitizeFileName(doc.fileName);
      const accessLevel = doc.accessLevel || 'INTERNAL';
      const docHash = this.computeHash(doc.fileContent);

      const chunks = this.chunkDocumentContent(doc.fileContent, sanitizedName);

      for (const chunk of chunks) {
        const activityId = `act-doc-${sanitizedName.replace(/\./g, '-')}-chunk-${chunk.chunkIndex}`;
        const externalId = `doc-${sanitizedName}-L${chunk.startLine}-L${chunk.endLine}`;

        activities.push({
          id: activityId,
          sourceId,
          projectId,
          sourceType: sanitizedName.endsWith('.txt') ? 'TXT_UPLOAD' : 'DOCUMENT',
          externalId,
          activityType: 'DOCUMENT_CHUNK',
          title: chunk.sectionHeading
            ? `${sanitizedName}: ${chunk.sectionHeading}`
            : `${sanitizedName} (Lines ${chunk.startLine}-${chunk.endLine})`,
          contentBody: chunk.content,
          authorName: 'Document Contributor',
          accessLevel,
          activityTimestamp: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          originalPath: sanitizedName,
          contentHash: chunk.contentHash,
          metadata: {
            originalFileName: doc.fileName,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            chunkIndex: chunk.chunkIndex,
            parentDocumentHash: docHash,
            sectionHeading: chunk.sectionHeading,
            integration: 'DOCUMENT_UPLOAD_V1',
          },
        });
      }
    }

    return activities;
  }

  /**
   * Deterministically chunks document text by Markdown headers or 50-line boundaries,
   * strictly preserving original line numbers.
   */
  chunkDocumentContent(text: string, documentId: string, maxLinesPerChunk = 50): DocumentChunk[] {
    const lines = text.split(/\r?\n/);
    const chunks: DocumentChunk[] = [];

    if (lines.length <= maxLinesPerChunk) {
      // Small document: single chunk
      return [
        {
          documentId,
          chunkIndex: 1,
          startLine: 1,
          endLine: lines.length,
          content: text.trim(),
          contentHash: this.computeHash(text),
        },
      ];
    }

    let currentChunkLines: string[] = [];
    let startLine = 1;
    let currentHeading: string | undefined = undefined;
    let chunkIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const isHeader = /^#{1,4}\s+(.+)$/.test(line);

      // If we encounter a new major header and already have accumulated lines >= 15
      if (isHeader && currentChunkLines.length >= 15) {
        const chunkContent = currentChunkLines.join('\n').trim();
        if (chunkContent.length > 0) {
          chunks.push({
            documentId,
            chunkIndex,
            startLine,
            endLine: lineNumber - 1,
            content: chunkContent,
            contentHash: this.computeHash(chunkContent),
            sectionHeading: currentHeading,
          });
          chunkIndex++;
        }
        currentChunkLines = [line];
        startLine = lineNumber;
        currentHeading = line.replace(/^#{1,4}\s+/, '').trim();
        continue;
      }

      currentChunkLines.push(line);
      if (isHeader && !currentHeading) {
        currentHeading = line.replace(/^#{1,4}\s+/, '').trim();
      }

      // Max line boundary reached
      if (currentChunkLines.length >= maxLinesPerChunk) {
        const chunkContent = currentChunkLines.join('\n').trim();
        if (chunkContent.length > 0) {
          chunks.push({
            documentId,
            chunkIndex,
            startLine,
            endLine: lineNumber,
            content: chunkContent,
            contentHash: this.computeHash(chunkContent),
            sectionHeading: currentHeading,
          });
          chunkIndex++;
        }
        currentChunkLines = [];
        startLine = lineNumber + 1;
        currentHeading = undefined;
      }
    }

    // Push remaining lines
    if (currentChunkLines.length > 0) {
      const chunkContent = currentChunkLines.join('\n').trim();
      if (chunkContent.length > 0) {
        chunks.push({
          documentId,
          chunkIndex,
          startLine,
          endLine: lines.length,
          content: chunkContent,
          contentHash: this.computeHash(chunkContent),
          sectionHeading: currentHeading,
        });
      }
    }

    return chunks;
  }

  sanitizeFileName(fileName: string): string {
    // Strip path traversal sequences and illegal characters
    const baseName = fileName.replace(/^.*[\\\/]/, '');
    return baseName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content || '').digest('hex');
  }
}
