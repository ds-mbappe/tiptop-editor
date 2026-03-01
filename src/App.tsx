import { HeroUIProvider, ToastProvider } from "@heroui/react"
import TiptopEditor from "./components/editor/TiptopEditor"

function App() {

  return (
    <HeroUIProvider>
      <TiptopEditor />
      <ToastProvider placement="top-right" />
    </HeroUIProvider>
  )
}

export default App
