import { useSettingsNavigation } from "@revolt/app/interface/settings/Settings";
import { CategoryButton, Symbol } from "@revolt/ui";

import { type FerretTab, setFerretTab } from "./settingsTab";

/**
 * Card on Stoat's own settings pages that jumps to the matching Ferret
 * tab, so Ferret's extras are found where people look for them.
 */
export function FerretSettingsLink(props: {
  tab: FerretTab;
  title: string;
  description: string;
}) {
  if (!window.ferret) return null;
  const { navigate } = useSettingsNavigation();

  return (
    <CategoryButton.Group>
      <CategoryButton
        icon={<Symbol>pets</Symbol>}
        action="chevron"
        description={props.description}
        onClick={() => {
          setFerretTab(props.tab);
          navigate("ferret");
        }}
      >
        {props.title}
      </CategoryButton>
    </CategoryButton.Group>
  );
}
