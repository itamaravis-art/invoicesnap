const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export class DriveClient {
  constructor(private accessToken: string) {}

  private headers() {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata: Record<string, unknown> = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) metadata.parents = [parentId];

    const response = await fetch(`${DRIVE_API}/files`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) throw new Error("Failed to create folder");
    const data = await response.json();
    return data.id;
  }

  async findFolder(name: string, parentId?: string): Promise<string | null> {
    const query = parentId
      ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await fetch(
      `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      { headers: this.headers() }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.files?.[0]?.id || null;
  }

  async ensureFolder(name: string, parentId?: string): Promise<string> {
    const existing = await this.findFolder(name, parentId);
    if (existing) return existing;
    return this.createFolder(name, parentId);
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    parentId: string
  ): Promise<string> {
    const metadata = {
      name: fileName,
      parents: [parentId],
    };

    const boundary = "invoicesnap_boundary";
    const body = [
      `--${boundary}\r\n`,
      `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
      `${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
    ].join("");

    const bodyBuffer = Buffer.concat([
      Buffer.from(body),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const response = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
      method: "POST",
      headers: {
        ...this.headers(),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    if (!response.ok) throw new Error("Failed to upload file");
    const data = await response.json();
    return data.id;
  }

  async shareWithEmail(fileId: string, email: string, role: "reader" | "writer" = "reader"): Promise<void> {
    const response = await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user",
        role,
        emailAddress: email,
      }),
    });

    if (!response.ok) throw new Error("Failed to share file");
  }
}
