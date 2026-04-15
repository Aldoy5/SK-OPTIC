import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, ArrowRight, CalendarDays } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface PrescriptionData {
  estOrdonnanceValide: boolean;
  oeilDroit?: { sphere?: number; cylindre?: number; axe?: number; addition?: number };
  oeilGauche?: { sphere?: number; cylindre?: number; axe?: number; addition?: number };
  categorieRecommandee: string;
  explication: string;
}

export function UploadPrescription() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PrescriptionData | null>(null);
  const navigate = useNavigate();
  const geminiApiKey =
    import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError('Veuillez sélectionner une image ou un fichier PDF.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!geminiApiKey) {
      setError("La clé API Gemini est manquante. Ajoutez VITE_GEMINI_API_KEY dans votre configuration.");
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          
          const response = await ai.models.generateContent({
            model: geminiModel,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                  }
                },
                {
                  text: "Tu es un assistant ophtalmologique expert. Analyse cette ordonnance. Extrais les valeurs pour l'œil droit (OD) et l'œil gauche (OG) : Sphère (SPH), Cylindre (CYL), Axe (AXE), Addition (ADD). Détermine ensuite la catégorie principale de lunettes dont le patient a besoin parmi : 'Myopie', 'Presbytie', 'Astigmatisme', 'Hypermétropie'. Si l'image n'est pas une ordonnance, mets estOrdonnanceValide à false et explique pourquoi."
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  estOrdonnanceValide: { type: Type.BOOLEAN, description: "Vrai si l'image est bien une ordonnance ophtalmologique" },
                  oeilDroit: {
                    type: Type.OBJECT,
                    properties: {
                      sphere: { type: Type.NUMBER },
                      cylindre: { type: Type.NUMBER },
                      axe: { type: Type.NUMBER },
                      addition: { type: Type.NUMBER }
                    }
                  },
                  oeilGauche: {
                    type: Type.OBJECT,
                    properties: {
                      sphere: { type: Type.NUMBER },
                      cylindre: { type: Type.NUMBER },
                      axe: { type: Type.NUMBER },
                      addition: { type: Type.NUMBER }
                    }
                  },
                  categorieRecommandee: {
                    type: Type.STRING,
                    description: "Catégorie recommandée: 'Myopie', 'Presbytie', 'Astigmatisme', 'Hypermétropie'"
                  },
                  explication: {
                    type: Type.STRING,
                    description: "Explication courte et rassurante pour le patient sur sa correction."
                  }
                },
                required: ["estOrdonnanceValide", "categorieRecommandee", "explication"]
              }
            }
          });

          const resultText = response.text;
          if (resultText) {
            const sanitizedText = resultText
              .replace(/^```json\s*/i, '')
              .replace(/```$/i, '')
              .trim();
            const parsedResult = JSON.parse(sanitizedText) as PrescriptionData;
            if (!parsedResult.estOrdonnanceValide) {
              setError(parsedResult.explication || "Le document fourni ne semble pas être une ordonnance valide.");
            } else {
              setResult(parsedResult);
            }
          } else {
            setError("L'IA n'a pas renvoyé de résultat exploitable.");
          }
        } catch (err: unknown) {
          console.error(err);
          const errorMessage =
            err instanceof Error ? err.message : "Une erreur s'est produite lors de l'analyse par l'IA.";
          setError(`Analyse IA échouée : ${errorMessage}`);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier.");
        setIsAnalyzing(false);
      };
    } catch (err) {
      setError("Une erreur inattendue s'est produite.");
      setIsAnalyzing(false);
    }
  };

  const formatValue = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-purple-700" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Votre Ordonnance
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Téléchargez votre ordonnance. Notre IA analysera vos corrections pour vous proposer les montures adaptées.
          </p>
        </div>

        {!result ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-purple-700 transition-colors bg-gray-50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-purple-700 hover:text-purple-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-700 px-2 py-1"
                    >
                      <span>Télécharger un fichier</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF jusqu'à 10MB
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {file && !error && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Prêt pour l'analyse
                    </p>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="ml-auto text-sm text-green-700 hover:text-green-900 font-medium"
                  >
                    Changer
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                onClick={handleUpload}
                disabled={!file || isAnalyzing}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Analyse par l'IA en cours...
                  </>
                ) : (
                  'Analyser mon ordonnance'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-start">
                <Eye className="h-6 w-6 text-purple-700 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-purple-900">Résultat de l'analyse</h3>
                  <p className="mt-2 text-purple-800">{result.explication}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Œil Droit (OD)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Sphère (SPH)</span><span className="font-medium">{formatValue(result.oeilDroit?.sphere)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cylindre (CYL)</span><span className="font-medium">{formatValue(result.oeilDroit?.cylindre)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Axe</span><span className="font-medium">{result.oeilDroit?.axe ? `${result.oeilDroit.axe}°` : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Addition (ADD)</span><span className="font-medium">{formatValue(result.oeilDroit?.addition)}</span></div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Œil Gauche (OG)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Sphère (SPH)</span><span className="font-medium">{formatValue(result.oeilGauche?.sphere)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cylindre (CYL)</span><span className="font-medium">{formatValue(result.oeilGauche?.cylindre)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Axe</span><span className="font-medium">{result.oeilGauche?.axe ? `${result.oeilGauche.axe}°` : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Addition (ADD)</span><span className="font-medium">{formatValue(result.oeilGauche?.addition)}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/appointment')}
                className="w-full flex items-center justify-center py-4 px-4 border border-purple-200 rounded-md shadow-sm text-lg font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors"
              >
                Prendre rendez-vous
                <CalendarDays className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={() => navigate(`/shop?category=${result.categorieRecommandee}`)}
                className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              >
                Voir les montures
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Analyser une autre ordonnance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
