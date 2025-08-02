import { HeroUIProvider } from "@heroui/react"
import TiptopEditor from "./components/TiptopEditor"

function App() {

  return (
    <HeroUIProvider>
      <TiptopEditor />
    </HeroUIProvider>
  )
}

export default App
