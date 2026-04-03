import { Dropdown, Label, Toast } from "@heroui/react"
import TiptopEditor from "./components/editor/TiptopEditor"

function App() {

  return (
    <div className="light" data-theme="light">
      <TiptopEditor
        editorOptions={{ editable: true }}
        slots={{
          dragHandleDropdown(props) {
            return (
              <Dropdown.Section>
                <Dropdown.Item id="test" textValue="Hello">
                  <Label>Hello</Label>
                </Dropdown.Item>
              </Dropdown.Section>
            )
          },
        }}
      />
      <Toast.Provider placement="top end" />
    </div>
  )
}

export default App
