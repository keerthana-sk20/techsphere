import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); localStorage.setItem("techsphere_token", data.token); navigate("/admin"); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="admin-login"><Link className="login-back" to="/"><ArrowLeft size={15} /> TechSphere</Link><div className="login-card"><div className="login-icon"><LockKeyhole size={21} /></div><span className="eyebrow">NEXABYTE TECHNOLOGIES</span><h1>Welcome back.</h1><p>Sign in to manage your journal.</p><form onSubmit={submit}><label>Email address<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="form-error">{error}</div>}<button className="button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in to dashboard"}</button></form><span className="login-secure">Protected NexaByte workspace</span></div></main>;
}
