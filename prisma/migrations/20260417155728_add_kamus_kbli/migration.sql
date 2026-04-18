-- CreateTable
CREATE TABLE "kamus_kbli" (
    "id" SERIAL NOT NULL,
    "kode_kbli" TEXT NOT NULL,
    "kode_gabungan" TEXT,
    "kategori" TEXT,
    "judul" TEXT,
    "deskripsi" TEXT,

    CONSTRAINT "kamus_kbli_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kamus_kbli_kode_kbli_key" ON "kamus_kbli"("kode_kbli");
