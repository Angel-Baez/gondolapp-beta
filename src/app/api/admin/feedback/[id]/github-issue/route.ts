import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Mapeo de tipos de feedback a etiquetas de GitHub
const TIPO_TO_LABEL: Record<string, string> = {
  Bug: "bug",
  Mejora: "enhancement",
  Pregunta: "question",
  Otro: "feedback",
};

// Mapeo de prioridades a etiquetas de GitHub
const PRIORIDAD_TO_LABEL: Record<string, string> = {
  Critica: "priority: critical",
  Alta: "priority: high",
  Media: "priority: medium",
  Baja: "priority: low",
};

/**
 * POST /api/admin/feedback/[id]/github-issue
 * Crea un issue en GitHub a partir de un reporte de feedback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validar que existe GITHUB_TOKEN
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: "GITHUB_TOKEN no está configurado en las variables de entorno" 
        },
        { status: 500 }
      );
    }

    // Validar ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de feedback no válido" },
        { status: 400 }
      );
    }

    // Obtener el reporte de la base de datos
    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");
    const reporte = await collection.findOne({ _id: new ObjectId(id) });

    if (!reporte) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene un issue creado
    if (reporte.githubIssueUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Este reporte ya tiene un issue de GitHub asociado",
          issueUrl: reporte.githubIssueUrl
        },
        { status: 400 }
      );
    }

    // Configuración del repositorio (puede ser configurado vía env)
    const repoOwner = process.env.GITHUB_REPO_OWNER || "Angel-Baez";
    const repoName = process.env.GITHUB_REPO_NAME || "gondolapp-beta";

    // Construir las etiquetas
    const labels: string[] = ["beta-feedback"];
    
    // Añadir etiquetas de tipo
    if (reporte.tipo && Array.isArray(reporte.tipo)) {
      reporte.tipo.forEach((tipo: string) => {
        if (TIPO_TO_LABEL[tipo]) {
          labels.push(TIPO_TO_LABEL[tipo]);
        }
      });
    }

    // Añadir etiqueta de prioridad
    if (reporte.prioridad && PRIORIDAD_TO_LABEL[reporte.prioridad]) {
      labels.push(PRIORIDAD_TO_LABEL[reporte.prioridad]);
    }

    // Añadir categorías como etiquetas
    if (reporte.categorias && Array.isArray(reporte.categorias)) {
      reporte.categorias.forEach((cat: string) => {
        labels.push(`area: ${cat}`);
      });
    }

    // Construir el cuerpo del issue
    const issueBody = construirCuerpoIssue(reporte);

    // Crear el issue en GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: `[Feedback] ${reporte.titulo}`,
          body: issueBody,
          labels: labels,
        }),
      }
    );

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      console.error("❌ Error de GitHub API:", errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear issue en GitHub: ${errorData.message || "Error desconocido"}` 
        },
        { status: githubResponse.status }
      );
    }

    const issueData = await githubResponse.json();
    const issueUrl = issueData.html_url;
    const issueNumber = issueData.number;

    // Actualizar el reporte con la URL del issue
    const ahora = new Date();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          githubIssueUrl: issueUrl,
          githubIssueNumber: issueNumber,
          actualizadoEn: ahora,
        },
        $push: {
          historial: {
            fecha: ahora,
            mensaje: `Issue de GitHub creado: #${issueNumber}`,
          },
        } as never,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Issue de GitHub creado correctamente",
      issueUrl,
      issueNumber,
    });
  } catch (error) {
    console.error("❌ Error al crear issue de GitHub:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear issue de GitHub",
      },
      { status: 500 }
    );
  }
}

/**
 * Construye el cuerpo del issue con formato Markdown
 */
function construirCuerpoIssue(reporte: Record<string, unknown>): string {
  const metadata = reporte.metadata as Record<string, string> | undefined;
  const tipos = reporte.tipo as string[] | undefined;
  const categorias = reporte.categorias as string[] | undefined;
  const screenshots = reporte.screenshots as string[] | undefined;
  
  let body = `## 📝 Descripción del Feedback

${reporte.descripcion}

---

## 📋 Información del Reporte

| Campo | Valor |
|-------|-------|
| **Tipo** | ${tipos?.join(", ") || "N/A"} |
| **Prioridad** | ${reporte.prioridad || "N/A"} |
| **Categorías** | ${categorias?.join(", ") || "N/A"} |
| **Estado** | ${reporte.estado || "Pendiente"} |
| **Email del Usuario** | ${reporte.userEmail || "No proporcionado"} |
| **Fecha de Creación** | ${reporte.creadoAt ? new Date(reporte.creadoAt as string).toLocaleString("es-ES") : "N/A"} |

---

## 🖥️ Información Técnica

| Campo | Valor |
|-------|-------|
| **Navegador** | ${metadata?.navegador || "N/A"} |
| **Dispositivo** | ${metadata?.dispositivo || "N/A"} |
| **Sistema Operativo** | ${metadata?.sistemaOperativo || "N/A"} |
| **Resolución** | ${metadata?.resolucionPantalla || "N/A"} |
| **URL** | ${metadata?.url || "N/A"} |
| **Versión App** | ${metadata?.versionApp || "N/A"} |

`;

  // Añadir screenshots si existen
  if (screenshots && screenshots.length > 0) {
    body += `---

## 📸 Capturas de Pantalla

`;
    screenshots.forEach((src, index) => {
      // Solo incluir si es una URL válida (no base64 muy largo)
      if (src.startsWith("http") || src.length < 500) {
        body += `![Screenshot ${index + 1}](${src})\n\n`;
      } else {
        body += `*Screenshot ${index + 1}: Imagen base64 (no se puede mostrar directamente)*\n\n`;
      }
    });
  }

  body += `---

> 🤖 *Este issue fue creado automáticamente desde el sistema de feedback de GondolApp*`;

  return body;
}
