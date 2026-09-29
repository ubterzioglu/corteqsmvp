// A09c — görsel olmayan ek kartı sözleşmesi.
//
// Bugünkü `<img>` akışı PDF/Office eklerinde KIRIK görsel gösteriyordu. Kural:
// görsel ek → thumbnail; belge eki → `<img>` YOK, ad + ikon + boyut kartı.
// `AttachmentCard` sunum bileşenidir (hook yok, provider istemez).

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RevisionAttachment } from "@/lib/admin-shell/revision-requests";
import { AttachmentCard } from "./RevisionAttachmentGrid";

function attachment(overrides: Partial<RevisionAttachment> = {}): RevisionAttachment {
  return {
    id: "a-1",
    requestId: "r-1",
    commentId: null,
    storagePath: "request/r-1/1-a-x.png",
    fileName: "ekran-goruntusu.png",
    contentType: "image/png",
    sizeBytes: 2048,
    createdBy: "admin-1",
    createdAt: "2026-09-29T12:00:00.000Z",
    ...overrides,
  };
}

function renderCard(props: Partial<Parameters<typeof AttachmentCard>[0]> = {}) {
  render(
    <AttachmentCard
      attachment={attachment()}
      url="https://signed.example/x.png"
      onDelete={vi.fn()}
      isDeleting={false}
      {...props}
    />,
  );
}

describe("AttachmentCard — görsel ek", () => {
  it("signed URL geldiyse thumbnail çizer", () => {
    renderCard();

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://signed.example/x.png");
    expect(screen.queryByText("ekran-goruntusu.png")).not.toBeInTheDocument();
  });

  it("URL henüz gelmediyse spinner gösterir, kırık <img> ÇİZMEZ", () => {
    renderCard({ url: null });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("AttachmentCard — belge eki (A09c)", () => {
  it("PDF'te <img> YOK; ad + boyut kartı var", () => {
    renderCard({
      attachment: attachment({
        fileName: "sozlesme.pdf",
        contentType: "application/pdf",
        sizeBytes: 1258291,
        storagePath: "request/r-1/2-b-sozlesme.pdf",
      }),
      url: "https://signed.example/sozlesme.pdf",
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("sozlesme.pdf")).toBeInTheDocument();
    expect(screen.getByText("1.2 MB")).toBeInTheDocument();
    expect(screen.getByTitle("sozlesme.pdf")).toHaveAttribute(
      "href",
      "https://signed.example/sozlesme.pdf",
    );
  });

  it("content_type null olsa da uzantıdan belge olduğu sezilir", () => {
    renderCard({
      attachment: attachment({ fileName: "butce.xlsx", contentType: null, sizeBytes: 20480 }),
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("butce.xlsx")).toBeInTheDocument();
    expect(screen.getByText("20 KB")).toBeInTheDocument();
  });

  it("URL gelmediyse belge kartı tıklanamaz ama ad/boyut görünür", () => {
    renderCard({
      attachment: attachment({ fileName: "rapor.docx", contentType: "application/msword" }),
      url: null,
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("rapor.docx")).toBeInTheDocument();
    expect(screen.getByTitle("rapor.docx")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("AttachmentCard — silme düğmesi", () => {
  it("her ek türünde 'Eki sil' düğmesi var", () => {
    renderCard({
      attachment: attachment({ fileName: "not.pdf", contentType: "application/pdf" }),
    });

    expect(screen.getByRole("button", { name: "Eki sil" })).toBeInTheDocument();
  });
});
