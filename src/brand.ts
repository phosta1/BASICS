/**
 * BASICS International Brand Tokens
 * Exact colors provided by client:
 *   Primary:   #5DC269  (bright green)
 *   Secondary: #2C8E3B  (deep green)
 *   Gold:      #D4A017  (accent — from banner assets)
 */

export const BASICS_COLORS = {
  primary:       "#5DC269",   // bright green — buttons, highlights, active states
  primaryDark:   "#4AAD56",   // hover / pressed
  primaryLight:  "#E8F8EB",   // soft tint backgrounds
  secondary:     "#2C8E3B",   // deep green — sidebar, headers, depth
  secondaryLight:"#358046",   // sidebar hover
  gold:          "#D4A017",   // amber gold — accent, badges
  goldLight:     "#FBF0CC",   // light gold tint
  white:         "#FFFFFF",
  textOnGreen:   "#FFFFFF",
  textPrimary:   "#1A3A1F",   // very dark green for body text
  textSecondary: "#4E7055",   // muted green-grey
  borderColor:   "#B8E8BF",   // light green border
  bgPage:        "#F2FAF3",   // very light green page background
};

/** Ant Design theme override — exact BASICS International branding */
export const BASICS_THEME = {
  token: {
    colorPrimary:     BASICS_COLORS.primary,
    colorLink:        BASICS_COLORS.secondary,
    colorLinkHover:   BASICS_COLORS.primary,
    colorSuccess:     BASICS_COLORS.primary,
    colorWarning:     BASICS_COLORS.gold,
    colorTextHeading: BASICS_COLORS.secondary,
    colorBgLayout:    BASICS_COLORS.bgPage,
    borderRadius:     6,
    fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Menu: {
      colorItemBg:           BASICS_COLORS.secondary,
      colorSubItemBg:        BASICS_COLORS.secondary,
      colorItemText:         "rgba(255,255,255,0.85)",
      colorItemTextSelected: "#ffffff",
      colorItemTextHover:    "#ffffff",
      colorItemBgSelected:   BASICS_COLORS.primary,
      colorItemBgHover:      BASICS_COLORS.secondaryLight,
      colorGroupTitle:       "rgba(255,255,255,0.45)",
    },
    Layout: {
      siderBg:  BASICS_COLORS.secondary,
      headerBg: "#ffffff",
    },
    Button: {
      colorPrimary:       BASICS_COLORS.primary,
      colorPrimaryHover:  BASICS_COLORS.primaryDark,
      colorPrimaryActive: BASICS_COLORS.primaryDark,
      borderRadius: 4,
    },
    Table: {
      headerBg:    "#EDF7EF",
      headerColor: BASICS_COLORS.secondary,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
};
