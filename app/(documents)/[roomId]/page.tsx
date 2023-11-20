"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Provider from "y-partykit/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import { getBaseExtensions } from "@/tiptapExtensions";

const doc = new Y.Doc();

export default function Page({ params }: { params: { roomId: string } }) {
  const provider = new Provider("localhost:1999", params.roomId, doc);

  const editor = useEditor({
    extensions: [
      ...getBaseExtensions(),
      Collaboration.configure({
        document: provider.doc
      }),
      // Register the collaboration cursor extension
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: provider.id,
          color: "#f783ac"
        }
      })
    ]
  });

  return <EditorContent style={{ border: "solid" }} editor={editor} />;
}
