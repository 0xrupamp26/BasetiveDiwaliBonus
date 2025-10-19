"use client";

import { MainLayout } from "~/components/layout/MainLayout";
import { Home } from "./components/Home";

export default function App() {
  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}
