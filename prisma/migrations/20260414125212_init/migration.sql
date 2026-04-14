-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kbli_mapping" (
    "id" SERIAL NOT NULL,
    "nama_usaha" TEXT,
    "status_perusahaan" TEXT,
    "status_hasil_gc" TEXT,
    "kbli_2020" TEXT,
    "kbli_2025" TEXT,
    "korespondensi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kbli_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "kbli_mapping_kbli_2020_idx" ON "kbli_mapping"("kbli_2020");

-- CreateIndex
CREATE INDEX "kbli_mapping_kbli_2025_idx" ON "kbli_mapping"("kbli_2025");
