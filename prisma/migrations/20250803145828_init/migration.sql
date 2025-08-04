-- CreateEnum
CREATE TYPE "public"."Region" AS ENUM ('EUROPE', 'NORTH_AMERICA', 'JAPAN', 'FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'UK', 'AUSTRALIA', 'WORLD', 'PAL', 'NTSC', 'NTSC_J', 'NTSC_U');

-- CreateEnum
CREATE TYPE "public"."ItemCondition" AS ENUM ('SEALED', 'MINT', 'NEAR_MINT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'LOOSE', 'CIB', 'BOXED', 'MANUAL_ONLY', 'CART_ONLY', 'DISC_ONLY');

-- CreateEnum
CREATE TYPE "public"."CollectionStatus" AS ENUM ('OWNED', 'WANTED', 'SOLD', 'LOANED', 'FOR_SALE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."consoles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "cpu" TEXT,
    "memory" TEXT,
    "graphics" TEXT,
    "screenscrapeId" INTEGER,
    "aiEnhancedDescription" TEXT,
    "historicalContext" TEXT,
    "technicalAnalysis" TEXT,
    "culturalImpact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."console_variants" (
    "id" TEXT NOT NULL,
    "consoleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "public"."Region" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "image" TEXT,
    "rarity" TEXT,
    "averagePrice" DOUBLE PRECISION,
    "priceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "console_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."games" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "consoleId" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "genre" TEXT,
    "developer" TEXT,
    "publisher" TEXT,
    "description" TEXT,
    "image" TEXT,
    "screenshots" TEXT[],
    "rating" DOUBLE PRECISION DEFAULT 0,
    "screenscrapeId" INTEGER,
    "aiEnhancedDescription" TEXT,
    "gameplayAnalysis" TEXT,
    "historicalSignificance" TEXT,
    "developmentStory" TEXT,
    "legacyImpact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_variants" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "public"."Region" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "image" TEXT,
    "rarity" TEXT,
    "specialEdition" BOOLEAN NOT NULL DEFAULT false,
    "limitedEdition" BOOLEAN NOT NULL DEFAULT false,
    "playerChoice" BOOLEAN NOT NULL DEFAULT false,
    "platinumHits" BOOLEAN NOT NULL DEFAULT false,
    "averagePrice" DOUBLE PRECISION,
    "priceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "game_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_console_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consoleId" TEXT,
    "consoleVariantId" TEXT,
    "status" "public"."CollectionStatus" NOT NULL DEFAULT 'OWNED',
    "condition" "public"."ItemCondition",
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "notes" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "hasBox" BOOLEAN NOT NULL DEFAULT false,
    "hasManual" BOOLEAN NOT NULL DEFAULT false,
    "hasCables" BOOLEAN NOT NULL DEFAULT false,
    "hasControllers" BOOLEAN NOT NULL DEFAULT false,
    "controllersCount" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_console_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_game_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "gameVariantId" TEXT,
    "status" "public"."CollectionStatus" NOT NULL DEFAULT 'OWNED',
    "condition" "public"."ItemCondition",
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "notes" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "hasBox" BOOLEAN NOT NULL DEFAULT false,
    "hasManual" BOOLEAN NOT NULL DEFAULT false,
    "hasMap" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "hoursPlayed" INTEGER,
    "lastPlayed" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_game_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "graphics" INTEGER,
    "sound" INTEGER,
    "gameplay" INTEGER,
    "story" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_collection_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalConsoles" INTEGER NOT NULL DEFAULT 0,
    "totalConsoleValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rareConsoles" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalGameValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedGames" INTEGER NOT NULL DEFAULT 0,
    "rareGames" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCondition" DOUBLE PRECISION,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_collection_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_wishlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "consoleId" TEXT,
    "gameVariantId" TEXT,
    "consoleVariantId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "maxPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "consoles_slug_key" ON "public"."consoles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "consoles_screenscrapeId_key" ON "public"."consoles"("screenscrapeId");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "public"."games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "games_screenscrapeId_key" ON "public"."games"("screenscrapeId");

-- CreateIndex
CREATE UNIQUE INDEX "game_reviews_userId_gameId_key" ON "public"."game_reviews"("userId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "user_collection_stats_userId_key" ON "public"."user_collection_stats"("userId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."console_variants" ADD CONSTRAINT "console_variants_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "public"."consoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."games" ADD CONSTRAINT "games_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "public"."consoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_variants" ADD CONSTRAINT "game_variants_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_console_collections" ADD CONSTRAINT "user_console_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_console_collections" ADD CONSTRAINT "user_console_collections_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "public"."consoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_console_collections" ADD CONSTRAINT "user_console_collections_consoleVariantId_fkey" FOREIGN KEY ("consoleVariantId") REFERENCES "public"."console_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_game_collections" ADD CONSTRAINT "user_game_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_game_collections" ADD CONSTRAINT "user_game_collections_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_game_collections" ADD CONSTRAINT "user_game_collections_gameVariantId_fkey" FOREIGN KEY ("gameVariantId") REFERENCES "public"."game_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_reviews" ADD CONSTRAINT "game_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_reviews" ADD CONSTRAINT "game_reviews_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_collection_stats" ADD CONSTRAINT "user_collection_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_wishlists" ADD CONSTRAINT "user_wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_wishlists" ADD CONSTRAINT "user_wishlists_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_wishlists" ADD CONSTRAINT "user_wishlists_consoleId_fkey" FOREIGN KEY ("consoleId") REFERENCES "public"."consoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
