import { AuthPage } from "@refinedev/antd";

/**
 * Refine's <AuthPage type="login" /> renders a production-ready
 * login form automatically wired to authProvider.login().
 * It handles loading states, error display, and redirects.
 */
export const LoginPage = () => (
  <AuthPage
    type="login"
    title="CRM Login"
    rememberMe={false}
    forgotPasswordLink={false}
    registerLink={false}
  />
);
