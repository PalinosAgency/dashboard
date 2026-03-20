import { createContext, useContext, ReactNode, useEffect, useState } from "react";


interface User {
  id: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Captura o token IMEDIATAMENTE na montagem.
  const [initialToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    if (token) {
        window.localStorage.setItem("auth_token_temp", token);
        return token;
    }
    return null;
  });

  useEffect(() => {
    async function validarAcesso() {
      try {
        setLoading(true);

        // Lógica de recuperação do token
        let tokenParaValidar = initialToken;
        if (!tokenParaValidar) {
            const params = new URLSearchParams(window.location.search);
            tokenParaValidar = params.get("token");
        }
        if (!tokenParaValidar) {
            tokenParaValidar = window.localStorage.getItem("auth_token_temp");
        }

        if (tokenParaValidar) {
          console.log("🔒 Token detectado:", tokenParaValidar);

          // --- ÁREA DE TESTES (ADMIN) ---
          // Se o token for o nosso código secreto, entra como Admin imediatamente
          if (tokenParaValidar === "ADMIN_TOKEN_2025") {
            console.log("🛠️ Modo de Teste: Admin Autenticado");
            setUser({
              id: "admin-999",
              name: "Administrador (Teste)",
              phone: "999999999"
            });
            setLoading(false);
            return; // Encerra a função aqui, não chama o banco de dados
          }
          // -------------------------------

          // Se não for admin, tenta validar via API segura
          const response = await fetch('/api/auth', {
            headers: {
              'Authorization': `Bearer ${tokenParaValidar}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              console.log("✅ Usuário autenticado:", data.user.name);
              setUser({
                id: String(data.user.id),
                name: data.user.name,
                phone: data.user.phone
              });
              // Não removemos o token do storage imediatamente no dashboard de visualização
              // para permitir refresh da página, a menos que seja regra de negócio estrita.
            } 

          } else {
            console.warn("⚠️ Token inválido ou expirado.");
            window.localStorage.removeItem("auth_token_temp");
          }
        } else {
            console.log("ℹ️ Nenhum token para processar.");
        }

      } catch (error) {
        console.error("❌ Erro Auth:", error);
      } finally {
        setLoading(false);
      }
    }

    validarAcesso();
  }, [initialToken]);

  const signIn = async () => {};
  const signOut = () => { 
      setUser(null); 
      window.localStorage.removeItem("auth_token_temp");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}