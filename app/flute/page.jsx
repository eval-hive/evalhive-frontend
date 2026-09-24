import React from "react";
import { notFound } from "next/navigation";
import FluteStudio from "../../src/flute/Studio";
export default function FlutePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <><meta name="flute-project" content="08e4d326-6d18-44d5-a287-1101f0a2f939" /><FluteStudio /></>;
}
