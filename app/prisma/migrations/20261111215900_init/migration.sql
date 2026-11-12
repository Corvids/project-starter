CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "body" VARCHAR(280) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notes_created_at_idx" ON "notes"("created_at");
