import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { relations } from "drizzle-orm";

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);
export const attachmentStatusEnum = pgEnum("attachment_status", [
  "pending",
  "completed",
  "failed",
]);
export const streamingStatusEnum = pgEnum("streaming_status", [
  "streaming",
  "completed",
  "error",
  "interrupted"
]);

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  chats: many(chats),
  attachments: many(attachments),
  userApiKeys: many(userApiKeys),
}));

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      name: "accounts_pk",
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const chats = pgTable("chats", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  shareId: text("share_id").unique().notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
});

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messages = pgTable("messages", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),

  parentId: text("parent_id"),

  role: messageRoleEnum("role").notNull().default("user"),
  contentType: text("content_type").notNull(),
  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  attachments: many(attachments),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
    relationName: "message_branches",
  }),
  children: many(messages, {
    relationName: "message_branches",
  }),
}));

export const attachments = pgTable("attachments", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),

  storageKey: text("storage_key").notNull(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  status: attachmentStatusEnum("status").default("pending").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  message: one(messages, {
    fields: [attachments.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
}));

export const userApiKeys = pgTable(
  "user_api_keys",
  {
    id: text("id").notNull().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: text("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_api_keys_user_id_provider").on(
      table.userId,
      table.provider
    ),
  ]
);

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [userApiKeys.userId],
    references: [users.id],
  }),
}));

export const streamingStates = pgTable("streaming_states", {
  id: text("id").primaryKey().notNull(),
  chatId: text("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  messageId: text("messageId")
    .references(() => messages.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  status: streamingStatusEnum("status").notNull().default("streaming"),
  lastChunkIndex: integer("last_chunk_index").notNull().default(0),
  totalChunks: integer("total_chunks").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streamingStatesRelations = relations(streamingStates, ({ one }) => ({
  chat: one(chats, {
    fields: [streamingStates.chatId],
    references: [chats.id],
  }),
  message: one(messages, {
    fields: [streamingStates.messageId],
    references: [messages.id],
  }),
}));
