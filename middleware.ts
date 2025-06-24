import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Define las rutas protegidas aquí
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
);

// Configuración de las rutas que deben ser protegidas
export const config = {
  matcher: ["/admin"],
};
