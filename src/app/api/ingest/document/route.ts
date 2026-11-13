import { NextRequest, NextResponse } from 'next/server';
import { ingestionPipeline } from '@/lib/ingestion/pipeline';
import { ProcessedDocumentInput } from '@/lib/ingestion/types';
import { AccessLevel, UserRole } from '@/types/relay';
import { getAuthenticatedSession } from '@/lib/security/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required. Please log in.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    const userRole = session.role;
    const processedInputs: ProcessedDocumentInput[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];

      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided in upload payload.' }, { status: 400 });
      }

      for (const file of files) {
        // Enforce 5 MB limit
        const MAX_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
          return NextResponse.json(
            { error: `File "${file.name}" exceeds the 5 MB ceiling (${(file.size / 1024 / 1024).toFixed(2)} MB).` },
            { status: 400 }
          );
        }

        const buffer = await file.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');

        // Check for binary content
        if (text.includes('\0')) {
          return NextResponse.json(
            { error: `File "${file.name}" contains binary characters and was rejected.` },
            { status: 400 }
          );
        }

        processedInputs.push({
          fileName: file.name,
          fileContent: text,
          fileSizeBytes: file.size,
          accessLevel: (formData.get('accessLevel') as AccessLevel) || 'INTERNAL',
        });
      }
    } else {
      // JSON body format support
      const body = await req.json();
      const { files, accessLevel } = body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return NextResponse.json({ error: 'Payload must contain a "files" array.' }, { status: 400 });
      }

      for (const f of files) {
        processedInputs.push({
          fileName: f.fileName,
          fileContent: f.fileContent,
          fileSizeBytes: Buffer.byteLength(f.fileContent, 'utf-8'),
          accessLevel: f.accessLevel || accessLevel || 'INTERNAL',
        });
      }
    }

    const report = await ingestionPipeline.ingestFromDocuments(processedInputs, 'proj-atlas-001', userRole);

    if (report.status === 'FAILED') {
      return NextResponse.json(
        { error: report.errorMessage, report },
        { status: report.errorMessage?.includes('Authorization') ? 403 : 400 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal document ingestion error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
