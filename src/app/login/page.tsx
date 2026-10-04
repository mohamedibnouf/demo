import { loginAction, demoLoginAction } from "@/server/auth/actions";
import { isDemoMode } from "@/lib/env";

const ACCOUNTS = [
  ["quality.manager@samco.demo", "Quality Manager"],
  ["quality.engineer@samco.demo", "Quality Engineer"],
  ["inspector@samco.demo", "Quality Inspector"],
  ["supplychain@samco.demo", "Supply Chain"],
  ["product.engineer@samco.demo", "Product Engineer"],
  ["management@samco.demo", "Management"],
  ["admin@samco.demo", "Admin"],
  ["supplier@samco.demo", "Supplier"],
  ["customer@samco.demo", "Customer"],
] as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">SAMCO | Carrier</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">
            Integrated Management System / Quality Management System
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-300">
            Saudi Airconditioning Manufacturing Co. Ltd. — enterprise quality, supplier, customer, audit, and IMS
            operations in one controlled workspace.
          </p>
        </div>
        <p className="text-xs text-slate-400">Interactive demonstration. Seeded records are DEMO DATA.</p>
      </div>
      <div className="flex items-center justify-center bg-ice p-6">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-samco">Sign in</p>
          <h2 className="mt-1 text-2xl font-semibold text-navy">Quality Management System</h2>
          {params.error ? <p className="mt-3 text-sm text-danger">Invalid email or password.</p> : null}
          <form action={loginAction} className="mt-6 space-y-4">
            <label className="block text-sm">
              Email / Username
              <input name="email" type="email" required className="mt-1 w-full rounded-md border border-line px-3 py-2" defaultValue="quality.manager@samco.demo" />
            </label>
            <label className="block text-sm">
              Password
              <input name="password" type="password" required className="mt-1 w-full rounded-md border border-line px-3 py-2" />
            </label>
            <button type="submit" className="w-full rounded-md bg-samco py-2 text-sm font-semibold text-white hover:bg-samco-600">
              Sign in
            </button>
          </form>
          {isDemoMode() ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase text-muted">Quick demo login</p>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNTS.map(([email, role]) => (
                  <form key={email} action={demoLoginAction.bind(null, email)}>
                    <button type="submit" className="w-full rounded border border-line px-2 py-1.5 text-left text-xs hover:bg-skyline">
                      {role}
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Shared password is documented in the demo pack.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
