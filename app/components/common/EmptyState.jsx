/**
 * Reusable empty state. Designed to drop straight into a `DataTable`'s
 * `emptyState` prop, but works anywhere a "no data yet" placeholder is
 * needed. Built entirely from Polaris web components.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.heading                 - Primary title.
 * @param {React.ReactNode} [props.description]           - Supporting copy.
 * @param {string} [props.icon]                           - `s-icon` type (e.g. "person", "orders", "view").
 * @param {"info"|"success"|"warning"|"critical"|"magic"|"subdued"} [props.iconTone="subdued"]
 * @param {{ content: React.ReactNode, onClick?: () => void, href?: string, variant?: string }} [props.action]
 *        Optional primary action button. When `href` is provided, renders as a link button.
 * @param {React.ReactNode} [props.children]              - Extra content rendered below the description.
 */
export function EmptyState({
  heading,
  description,
  icon,
  iconTone = "subdued",
  action,
  children,
}) {
  return (
    <s-stack
      direction="block"
      alignItems="center"
      justifyContent="center"
      gap="small-200"
      padding="large-200"
    >
      {icon && (
        <s-box 
          paddingBlock="small"
          background="subdued"
          padding="base"
          borderRadius="base"
          borderWidth="base"
          borderStyle="solid"
          borderColor="base"
        >
          <s-icon type={icon} tone={iconTone} />
        </s-box>
      )}

      {heading && <s-heading>{heading}</s-heading>}

      {description && (
        <s-text tone="subdued" textAlign="center">
          {description}
        </s-text>
      )}

      {children}

      {action && (
        <s-box paddingBlockStart="small">
          <s-button
            variant={action.variant || "primary"}
            href={action.href}
            onClick={action.onClick}
          >
            {action.content}
          </s-button>
        </s-box>
      )}
    </s-stack>
  );
}
