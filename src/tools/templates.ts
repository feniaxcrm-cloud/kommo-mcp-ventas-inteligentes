import { z } from "zod";
import { KommoClient } from "../kommo-client.js";
import { loadAccounts, getAccount } from "../token-store.js";

export const templateTools = {
  get_templates: {
    description:
      "Lista todas las plantillas de mensajes de una cuenta Kommo (WhatsApp, email, etc.).",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      page: z.number().optional().describe("Número de página (default 1)"),
      limit: z.number().optional().describe("Plantillas por página, max 250 (default 50)"),
    }),
    handler: async (params: { account: string; page?: number; limit?: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, params.account);
      if (!acc) return { error: `Cuenta "${params.account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/templates", undefined, {
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 50),
      });
      const templates = data?._embedded?.templates ?? [];
      return {
        account: acc.name,
        total: data?._total_items ?? templates.length,
        templates: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          content: t.content,
          is_active: t.is_active,
          created_at: t.created_at,
          updated_at: t.updated_at,
          external_id: t.external_id,
        })),
      };
    },
  },

  get_template: {
    description: "Obtiene los detalles de una plantilla específica.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      template_id: z.number().describe("ID de la plantilla"),
    }),
    handler: async ({ account, template_id }: { account: string; template_id: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", `/templates/${template_id}`);
      return { account: acc.name, template: data };
    },
  },

  create_templates: {
    description: "Crea una o varias plantillas de mensajes nuevas.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      templates: z
        .array(
          z.object({
            name: z.string().describe("Nombre de la plantilla"),
            content: z.string().describe("Contenido/texto de la plantilla"),
            is_active: z.boolean().optional().describe("Si está activa (default true)"),
          })
        )
        .describe("Array de plantillas a crear"),
    }),
    handler: async ({ account, templates }: { account: string; templates: any[] }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("POST", "/templates", templates);
      return { account: acc.name, created: data?._embedded?.templates ?? data };
    },
  },

  update_templates: {
    description: "Actualiza plantillas existentes.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      templates: z
        .array(
          z.object({
            id: z.number().describe("ID de la plantilla a actualizar"),
            name: z.string().optional(),
            content: z.string().optional(),
            is_active: z.boolean().optional(),
          })
        )
        .describe("Array de plantillas a actualizar"),
    }),
    handler: async ({ account, templates }: { account: string; templates: any[] }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("PATCH", "/templates", templates);
      return { account: acc.name, updated: data?._embedded?.templates ?? data };
    },
  },

  delete_template: {
    description: "Elimina una plantilla por su ID.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      template_id: z.number().describe("ID de la plantilla a eliminar"),
    }),
    handler: async ({ account, template_id }: { account: string; template_id: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      await client.request("DELETE", `/templates/${template_id}`);
      return { account: acc.name, deleted: true, template_id };
    },
  },
};
