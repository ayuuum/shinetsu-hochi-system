"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CertificateFilePickerProps = {
    files: File[];
    onFilesChange: (files: File[]) => void;
    multiple?: boolean;
};

type CropTarget = {
    file: File;
    url: string;
};

async function cropImageFile(file: File, imageUrl: string, zoom: number, offsetX: number, offsetY: number) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = Math.round(1200 * 0.7);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const baseScale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (canvas.width - width) / 2 + offsetX;
    const y = (canvas.height - height) / 2 + offsetY;
    ctx.drawImage(image, x, y, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "certificate";
    return new File([blob], `${name}-cropped.jpg`, { type: "image/jpeg" });
}

export function CertificateFilePicker({ files, onFilesChange, multiple = true }: CertificateFilePickerProps) {
    const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    useEffect(() => {
        return () => {
            if (cropTarget) URL.revokeObjectURL(cropTarget.url);
        };
    }, [cropTarget]);

    const previewStyle = useMemo(() => ({
        transform: `translate(${offsetX / 12}px, ${offsetY / 12}px) scale(${zoom})`,
    }), [offsetX, offsetY, zoom]);

    const handleSelect = (selectedFiles: File[]) => {
        const image = selectedFiles.find((file) => file.type.startsWith("image/"));
        const nonImages = selectedFiles.filter((file) => !file.type.startsWith("image/"));
        if (nonImages.length > 0) {
            onFilesChange(multiple ? [...files, ...nonImages] : nonImages.slice(0, 1));
        }
        if (image) {
            if (cropTarget) URL.revokeObjectURL(cropTarget.url);
            setCropTarget({ file: image, url: URL.createObjectURL(image) });
            setZoom(1);
            setOffsetX(0);
            setOffsetY(0);
        }
    };

    const applyCrop = async () => {
        if (!cropTarget) return;
        const cropped = await cropImageFile(cropTarget.file, cropTarget.url, zoom, offsetX, offsetY);
        onFilesChange(multiple ? [...files, cropped] : [cropped]);
        URL.revokeObjectURL(cropTarget.url);
        setCropTarget(null);
    };

    return (
        <div className="space-y-3">
            <Input
                type="file"
                accept="image/*,.pdf"
                multiple={multiple}
                onChange={(event) => handleSelect(Array.from(event.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">
                画像はプレビュー上でトリミングしてJPEG保存します。PDFは原本ファイルとして保存します。
            </p>
            {cropTarget ? (
                <div className="space-y-3 rounded-lg border border-border/60 p-3">
                    <div className="relative h-48 overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cropTarget.url} alt="証書プレビュー" className="h-full w-full object-contain transition-transform" style={previewStyle} />
                        <div className="pointer-events-none absolute inset-6 border-2 border-primary/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
                    </div>
                    <div className="grid gap-2 text-xs">
                        <label>拡大 <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" /></label>
                        <label>左右 <input type="range" min="-400" max="400" step="10" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} className="w-full" /></label>
                        <label>上下 <input type="range" min="-300" max="300" step="10" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="w-full" /></label>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={applyCrop}>この範囲で追加</Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                onFilesChange(multiple ? [...files, cropTarget.file] : [cropTarget.file]);
                                URL.revokeObjectURL(cropTarget.url);
                                setCropTarget(null);
                            }}
                        >
                            トリミングせず追加
                        </Button>
                    </div>
                </div>
            ) : null}
            {files.length > 0 ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="truncate">・{file.name}</li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
