// src/app/members/page.js
"use client";
import { useState } from "react";
import ParticipantsForm  from "@/components/participantsForm";
import ParticipantsTable from "@/components/participantsTable";

export default function ParticipantsPage() {
  const [reload, setReload] = useState(false);

  const triggerReload = () => setReload((r) => !r);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Участники</h1>
      <ParticipantsForm onAdded={triggerReload} />
      <ParticipantsTable
        reloadFlag={reload}
        onReload={triggerReload}
      />
    </div>
  );
}
