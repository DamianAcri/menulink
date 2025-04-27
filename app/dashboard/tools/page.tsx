"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react"; // Corregido: importar QRCodeCanvas explícitamente
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  theme_color: string;
  secondary_color: string;
  logo_url: string | null;
}

export default function ToolsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para cada herramienta
  const [campaignUrl, setCampaignUrl] = useState("");
  const [campaignSource, setCampaignSource] = useState("instagram");
  const [campaignName, setCampaignName] = useState("");
  const [generatedCampaignUrl, setGeneratedCampaignUrl] = useState("");
  
  const [qrColor, setQrColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(200);
  const [qrLogo, setQrLogo] = useState(true);
  
  const [emailNotifications, setEmailNotifications] = useState(false);
  
  // Refs para la descarga de elementos
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const menuPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Obtener el restaurante del usuario
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching restaurant:", error);
        } else {
          setRestaurant(restaurantData);
          
          // Actualizar el estado emailNotifications con el valor de la base de datos
          if (restaurantData?.email_notifications !== undefined) {
            console.log("Cargando valor de notificaciones:", restaurantData.email_notifications);
            setEmailNotifications(restaurantData.email_notifications);
          }
          
          // Si hay un restaurante, inicializar la URL base para campañas
          if (restaurantData?.slug) {
            setCampaignUrl(`https://menulink.com/r/${restaurantData.slug}`);
          }
        }
      } catch (error) {
        console.error("Error in tools page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, []);

  // Función para generar URL de campaña
  const generateCampaignUrl = () => {
    if (!campaignUrl) return;
    
    const baseUrl = campaignUrl;
    const utm_source = campaignSource;
    const utm_campaign = campaignName.replace(/\s+/g, '_').toLowerCase() || 'menu_campaign';
    
    const finalUrl = `${baseUrl}?utm_source=${utm_source}&utm_medium=qr&utm_campaign=${utm_campaign}`;
    setGeneratedCampaignUrl(finalUrl);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado al portapapeles!");
  };

  // Función para descargar QR como imagen
  const downloadQrCode = async (format: 'png' | 'svg') => {
    if (!qrCodeRef.current) return;
    
    try {
      if (format === 'png') {
        // En lugar de intentar manipular un canvas existente, crearemos uno nuevo desde cero
        const qrUrl = `https://menulink.com/r/${restaurant?.slug || 'menu'}`;
        
        // Usar la biblioteca qrcode directamente, que no tiene restricciones de seguridad
        const QRCode = await import('qrcode');
        
        // Crear un canvas nuevo
        const tempCanvas = document.createElement('canvas');
        
        // Generar el QR directamente en este canvas
        await QRCode.toCanvas(tempCanvas, qrUrl, {
          width: qrSize,
          margin: 2,
          color: {
            dark: qrColor,
            light: qrBgColor
          }
        });
        
        // Si queremos incluir logo, necesitaríamos dibujarlo manualmente
        if (qrLogo && restaurant?.logo_url) {
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            // Crear una imagen para el logo
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous'; // Importante para evitar errores CORS
            
            // Esperar a que el logo se cargue antes de dibujarlo
            await new Promise<void>((resolve, reject) => {
              logoImg.onload = () => {
                // Calcular posición central para el logo
                const logoSize = qrSize * 0.25;
                const position = (qrSize - logoSize) / 2;
                
                // Crear un fondo blanco para el logo
                ctx.fillStyle = qrBgColor;
                ctx.fillRect(position - 2, position - 2, logoSize + 4, logoSize + 4);
                
                // Dibujar el logo
                ctx.drawImage(logoImg, position, position, logoSize, logoSize);
                resolve();
              };
              logoImg.onerror = () => {
                // Si falla la carga del logo, continuar sin él
                console.error('Error cargando el logo');
                resolve();
              };
              logoImg.src = restaurant.logo_url ?? '';
            });
          }
        }
        
        // Ahora podemos obtener la URL de datos de manera segura
        try {
          const dataUrl = tempCanvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = dataUrl;
          downloadLink.download = `qrcode-${restaurant?.slug || 'menu'}-${Date.now()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error al generar la imagen:", error);
          alert("No se pudo generar la imagen. Intenta usar un logo con permisos CORS adecuados o exportar sin logo.");
        }
      } else {
        // Mantener el código existente para SVG
        // Para QRs con logo, recomendamos PNG en su lugar ya que SVG no manejaría el logo incrustado
        if (qrLogo && restaurant?.logo_url) {
          alert("Para QRs con logo, recomendamos descargar en formato PNG para asegurar la compatibilidad. Cambiando a PNG...");
          await downloadQrCode('png');
          return;
        }
        
        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) {
          throw new Error("No se encontró el elemento SVG");
        }
        
        // Clonar el SVG para no modificar el original
        const svgClone = svgElement.cloneNode(true) as SVGElement;
        
        // Asegurarnos de que el SVG tenga los colores correctos
        const paths = svgClone.querySelectorAll('path');
        paths.forEach(path => {
          if (path.getAttribute('fill') === '#FFFFFF') {
            path.setAttribute('fill', qrBgColor);
          } else if (path.getAttribute('fill') === '#000000') {
            path.setAttribute('fill', qrColor);
          }
        });
        
        // Serializar el SVG
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.download = `menulink-qr-${restaurant?.slug || 'menu'}.svg`;
        link.href = svgUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar la URL
        setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
      }
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert(`No se pudo descargar el QR. Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para descargar menú como PDF
  const downloadMenuAsPdf = async () => {
    if (!restaurant) return;
    
    try {
      // Simular carga del menú para PDF
      setLoading(true);
      
      // Crear nuevo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Añadir encabezado
      pdf.setFillColor(restaurant.theme_color || '#3b82f6');
      pdf.rect(0, 0, 210, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text(restaurant.name, 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      if (restaurant.description) {
        pdf.text(restaurant.description, 105, 25, { align: 'center' });
      }
      
      // Añadir URL del menú
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`https://menulink.com/r/${restaurant.slug}`, 105, 35, { align: 'center' });

      // Simular texto del menú (en un caso real, cargaríamos las categorías y platos)
      pdf.setFontSize(16);
      pdf.text('Menú Digital', 105, 45, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text('Escanea el QR para ver nuestro menú completo con precios actualizados', 105, 55, { align: 'center' });
      
      // Crear un canvas temporal para el QR
      const qrCanvas = document.createElement('canvas');
      const qrUrl = `https://menulink.com/r/${restaurant.slug}`;
      
      // Usar la versión adecuada de QRCode.toCanvas
      await new Promise<void>((resolve) => {
        import('qrcode').then(QRCodeLib => {
          QRCodeLib.toCanvas(qrCanvas, qrUrl, {
            width: 150,
            margin: 2,
            color: { dark: qrColor, light: qrBgColor }
          }, () => resolve());
        });
      });
      
      // Convertir canvas a imagen y añadir al PDF
      const qrImage = qrCanvas.toDataURL('image/png');
      pdf.addImage(qrImage, 'PNG', 80, 70, 50, 50);
      
      // Añadir información de contacto
      pdf.setFontSize(10);
      pdf.text('Generado con MenuLink - Tu menú digital profesional', 105, 280, { align: 'center' });
      
      // Guardar PDF
      pdf.save(`menu-${restaurant.slug}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar kit de recursos
  const downloadResourceKit = () => {
    if (!restaurant?.logo_url) {
      alert("Tu restaurante no tiene logo. Sube uno primero desde la sección de Perfil.");
      return;
    }
    
    alert("Esta función descargará un archivo ZIP con tu logo en diferentes formatos, portadas para redes sociales y plantillas para promociones. Actualmente en desarrollo.");
  };

  // Función para guardar preferencias de notificaciones
  const saveNotificationPreferences = async () => {
    if (!restaurant) return;
    
    try {
      console.log("Intentando guardar preferencias para el restaurante ID:", restaurant.id);
      console.log("Valor de email_notifications:", emailNotifications);
      
      // Guardar preferencias en supabase
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          email_notifications: emailNotifications
        })
        .eq('id', restaurant.id);
        
      if (error) {
        console.error("Error de Supabase:", JSON.stringify(error));
        throw error;
      }
      
      // Verificar que la actualización se haya aplicado correctamente
      const { data: updatedRestaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurant.id)
        .single();
        
      if (fetchError) {
        console.error("Error al verificar actualización:", JSON.stringify(fetchError));
        throw fetchError;
      }
      
      console.log("Valor actualizado en la base de datos:", updatedRestaurant.email_notifications);
      
      // Actualizar el estado del restaurante
      setRestaurant(updatedRestaurant);
      
      console.log("Preferencias guardadas correctamente");
      alert("¡Preferencias de notificaciones guardadas!");
    } catch (error) {
      console.error("Error guardando preferencias:", error instanceof Error ? error.message : JSON.stringify(error));
      alert("Error al guardar preferencias. Inténtalo de nuevo.");
    }
  };

  // Renderizado condicional para carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay restaurante configurado, mostrar mensaje
  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Necesitas completar la configuración de tu restaurante
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Antes de acceder a las herramientas, completa la información básica de tu restaurante.
        </p>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Ir al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
          Herramientas
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Utilidades para promocionar y gestionar tu menú digital.
        </p>
      </div>

      {/* Generador de enlaces personalizados para campañas */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Generador de enlaces para campañas
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Crea URLs personalizadas para tus campañas de marketing y rastrea su efectividad.
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="campaign-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL base
              </label>
              <input
                type="text"
                name="campaign-url"
                id="campaign-url"
                value={campaignUrl}
                onChange={(e) => setCampaignUrl(e.target.value)}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label htmlFor="campaign-source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fuente
                </label>
                <select
                  id="campaign-source"
                  name="campaign-source"
                  value={campaignSource}
                  onChange={(e) => setCampaignSource(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="qr">Código QR</option>
                  <option value="menu">Carta física</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre de campaña
                </label>
                <input
                  type="text"
                  name="campaign-name"
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="ej. primavera_2025"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={generateCampaignUrl}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generar enlace
              </button>
            </div>
            {generatedCampaignUrl && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-800 dark:text-gray-200 break-all">{generatedCampaignUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedCampaignUrl)}
                    className="ml-2 inline-flex items-center p-1 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generador de códigos QR */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 6h1m-7 7v1m-7-7H4m16-5v1m0 7v1M5 9.5V8m12 .5V8m-2.503 3h.01M9.503 11h.01M7.003 15h.01M18.003 15h.01M17.003 13h.01" />
            </svg>
            Generador de códigos QR
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Crea códigos QR personalizados para tu menú digital. Puedes personalizarlos con tus colores corporativos.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="qr-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color del QR
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    name="qr-color"
                    id="qr-color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="h-8 w-16 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="ml-2">
                    <button
                      type="button"
                      onClick={() => setQrColor(restaurant.theme_color || "#000000")}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Usar color principal
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="qr-bg-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color de fondo
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    name="qr-bg-color"
                    id="qr-bg-color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="h-8 w-16 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="qr-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tamaño: {qrSize}px
                </label>
                <input
                  type="range"
                  name="qr-size"
                  id="qr-size"
                  min="100"
                  max="300"
                  step="10"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="show-logo"
                  name="show-logo"
                  type="checkbox"
                  checked={qrLogo}
                  onChange={(e) => setQrLogo(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="show-logo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Mostrar logo en el centro
                </label>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => downloadQrCode('png')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                >
                  Descargar PNG
                </button>
              </div>
            </div>
            <div className="flex justify-center items-center p-4 bg-white dark:bg-gray-700 rounded-md">
              <div ref={qrCodeRef} className="qr-container">
                <QRCodeCanvas
                  value={`https://menulink.com/r/${restaurant.slug}`}
                  size={qrSize}
                  bgColor={qrBgColor}
                  fgColor={qrColor}
                  level="H"
                  includeMargin={true}
                  imageSettings={qrLogo && restaurant.logo_url ? {
                    src: restaurant.logo_url || "", // Added fallback empty string to ensure it's never null
                    x: undefined,
                    y: undefined,
                    height: qrSize * 0.25,
                    width: qrSize * 0.25,
                    excavate: true,
                  } : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descarga del menú en PDF */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Descargar menú en PDF
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Genera una versión PDF de tu menú para imprimir o compartir digitalmente. El PDF incluirá un código QR para que tus clientes puedan acceder a la versión digital actualizada.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={downloadMenuAsPdf}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generar y descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Kit de recursos gráficos */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kit de recursos gráficos
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Descarga recursos gráficos personalizados para tu negocio, incluyendo tu logo en diferentes formatos, portadas para redes sociales y plantillas para promociones.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={downloadResourceKit}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!restaurant?.logo_url}
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar recursos gráficos
            </button>
            {!restaurant?.logo_url && (
              <p className="mt-2 text-xs text-red-500">
                Necesitas añadir un logo a tu perfil primero.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Soporte y sugerencias */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Soporte y sugerencias
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              ¿Necesitas ayuda o tienes alguna sugerencia para mejorar nuestra plataforma? Ponte en contacto con nosotros.
            </p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-800 dark:text-gray-200">soporte@menulink.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-800 dark:text-gray-200">+34 912 345 678</span>
            </div>
            <div className="pt-2">
              <a 
                href={`mailto:damianacricort@gmail.com?subject=Soporte MenuLink - ${restaurant?.name || ''}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Contactar soporte
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de notificaciones */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notificaciones por email
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Configura tus preferencias de notificaciones para recibir información importante sobre tu menú digital.
            </p>
          </div>
          <div className="mt-5">
            <div className="flex items-center">
              <input
                id="email-notifications"
                name="email-notifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Recibir resumen semanal de visitas a mi menú
              </label>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={saveNotificationPreferences}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}