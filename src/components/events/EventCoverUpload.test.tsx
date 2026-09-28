import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventCoverUpload } from "./EventCoverUpload";

const uploadEventCover = vi.fn();
const removeEventCover = vi.fn();

vi.mock("@/lib/event-media", () => ({
  EVENT_COVER_ACCEPT: "image/jpeg,image/png,image/webp,image/avif",
  uploadEventCover: (...args: unknown[]) => uploadEventCover(...args),
  removeEventCover: (...args: unknown[]) => removeEventCover(...args),
}));

const selectFile = (name = "kapak.jpg", type = "image/jpeg") => {
  const input = document.getElementById("event-cover-file") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(["x"], name, { type })] } });
};

beforeEach(() => {
  uploadEventCover.mockReset();
  removeEventCover.mockReset();
  removeEventCover.mockResolvedValue(undefined);
});

describe("EventCoverUpload", () => {
  it("görsel yokken yükleme düğmesini ve sınırları gösterir", () => {
    render(<EventCoverUpload value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Görsel yükle" })).toBeInTheDocument();
    expect(screen.getByText(/en fazla 5MB/i)).toBeInTheDocument();
  });

  it("yüklenen görseli onChange ile bildirir", async () => {
    uploadEventCover.mockResolvedValue({ url: "https://cdn/a.jpg", path: "uid/a.jpg" });
    const onChange = vi.fn();
    render(<EventCoverUpload value={null} onChange={onChange} />);

    selectFile();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ url: "https://cdn/a.jpg", path: "uid/a.jpg" }));
  });

  it("yükleme hatasını onError ile iletir ve onChange'i ÇAĞIRMAZ", async () => {
    // ⚠️ Hata yolunda sessizce başarı bildirmek, kullanıcıya kapağı yüklenmiş
    // gösterip kaydı kapaksız bırakırdı — G01'de aynı sınıf kusur bulunmuştu.
    uploadEventCover.mockRejectedValue(new Error("Kapak görseli en fazla 5MB olabilir."));
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<EventCoverUpload value={null} onChange={onChange} onError={onError} />);

    selectFile();

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Kapak görseli en fazla 5MB olabilir."));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("görsel varken önizlemeyi çizer ve kaldırma dosyayı da siler", async () => {
    const onChange = vi.fn();
    render(
      <EventCoverUpload value={{ url: "https://cdn/a.jpg", path: "uid/a.jpg" }} onChange={onChange} />,
    );

    expect(screen.getByRole("img", { name: /önizleme/i })).toHaveAttribute("src", "https://cdn/a.jpg");

    fireEvent.click(screen.getByRole("button", { name: "Kapak görselini kaldır" }));

    expect(onChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(removeEventCover).toHaveBeenCalledWith("uid/a.jpg"));
  });

  it("yerine yeni görsel yüklenince ESKİSİNİ siler (yetim dosya bırakmaz)", async () => {
    uploadEventCover.mockResolvedValue({ url: "https://cdn/yeni.jpg", path: "uid/yeni.jpg" });
    render(
      <EventCoverUpload value={{ url: "https://cdn/eski.jpg", path: "uid/eski.jpg" }} onChange={vi.fn()} />,
    );

    selectFile("yeni.jpg");

    await waitFor(() => expect(removeEventCover).toHaveBeenCalledWith("uid/eski.jpg"));
  });

  it("path'i OLMAYAN (elle yapıştırılmış URL) değeri silmeye ÇALIŞMAZ", async () => {
    // Eski kayıtlar ham URL taşır; arkasında silinecek bir depolama nesnesi yoktur.
    const onChange = vi.fn();
    render(<EventCoverUpload value={{ url: "https://baska/site.jpg", path: null }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Kapak görselini kaldır" }));

    expect(onChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(removeEventCover).not.toHaveBeenCalled());
  });
});
