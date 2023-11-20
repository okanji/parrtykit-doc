import Party from "partykit/server";
import { onConnect } from "y-partykit";
import { createClient } from "@supabase/supabase-js";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { getBaseExtensions } from "@/tiptapExtensions";

import * as Y from "yjs";

// Create a single supabase client for interacting with your database

const transformer = TiptapTransformer.extensions(getBaseExtensions());
const rootFragmentField = "default";

export default class PartyKitServer implements Party.Server {
  constructor(readonly party: Party.Party) {}

  // async onRequest(request: Party.Request) {
  //   return ok();
  // }

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || "",
      {
        auth: { persistSession: false }
      }
    );

    console.log("*** ID", this.party.id);

    await onConnect(connection, this.party, {
      // load a document from a database, or some remote resource
      // and return a Y.Doc instance here (or null if no document exists)

      load: async () => {
        const data = (await this.party.storage.get(this.party.id)) as
          | Uint8Array
          | undefined;

        const doc = new Y.Doc();

        if (data) {
          Y.applyUpdate(doc, data);
        }
        // return new Y.Doc();
        return doc;
      },

      callback: {
        // called every few seconds after edits
        // you can use this to write to a database
        // or some external storage
        handler: async (doc) => {
          console.log("HANDLER", this.party.id);

          await this.party.storage.put(
            this.party.id,
            Y.encodeStateAsUpdate(doc)
          );

          const json = transformer.fromYdoc(doc, rootFragmentField);

          const { data, error } = await supabase
            .from("documents")
            .upsert(
              {
                name: this.party.id,
                document: json
              },
              { onConflict: "name" }
            )
            .select();

          if (error) {
            console.error("ERROR", error);
          }
        }
        // debounceWait: 5000, // default: 2000 ms
        // debounceMaxWait: 20000, // default: 10000 ms
        // timeout: 5000, // default: 5000 ms
      }
    });
  }
}
