import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, X, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { LessonNotes } from "./LessonNotes";
import confetti from "canvas-confetti";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number; // Optional since questions_for_users view doesn't include it
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  video_url?: string;
  external_link?: string;
  contentUrl?: string;
  questions?: Question[];
}

interface LessonModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string, passed: boolean) => void;
  userId?: string;
}

export const LessonModal = ({ lesson, isOpen, onClose, onComplete, userId }: LessonModalProps) => {
  const [currentPhase, setCurrentPhase] = useState<"content" | "quiz">("content");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correctCount: number } | null>(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

  // Helper function to convert YouTube URLs to embed format
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[7] && match[7].length === 11) {
      return `https://www.youtube.com/embed/${match[7]}`;
    }
    
    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return url; // Return original if not a YouTube URL
  };

  // Load questions when lesson changes
  useEffect(() => {
    if (lesson?.id) {
      loadQuestions();
    }
  }, [lesson?.id]);

  // Generate a signed URL for private storage videos (non-YouTube)
  useEffect(() => {
    const setupSignedUrl = async () => {
      const path = lesson?.video_url || lesson?.videoUrl;
      if (!path) {
        setSignedVideoUrl(null);
        return;
      }
      const isYouTube = path.includes('youtube.com') || path.includes('youtu.be');
      if (isYouTube) {
        setSignedVideoUrl(null);
        return;
      }
      try {
        const { data, error } = await supabase.storage
          .from('lesson-videos')
          .createSignedUrl(path, 3600);
        if (error) throw error;
        setSignedVideoUrl(data?.signedUrl || null);
      } catch (error) {
        if (import.meta.env?.DEV) console.error('Error creating signed video URL:', error);
        setSignedVideoUrl(null);
        toast({
          title: 'Erro ao carregar vídeo',
          description: 'Não foi possível acessar o vídeo desta lição.',
          variant: 'destructive',
        });
      }
    };
    setupSignedUrl();
  }, [lesson?.video_url, lesson?.videoUrl]);

  const loadQuestions = async () => {
    if (!lesson) return;
    
    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from("questions_for_users")
        .select("*")
        .eq("lesson_id", lesson.id)
        .order("created_at");

      if (error) {
        if (import.meta.env?.DEV) console.error("Error loading questions:", error);
        setQuestions([]);
      } else {
        const formattedQuestions = (data || []).map(q => ({
          id: q.id,
          question: q.question_text,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          // correctAnswer not included - questions_for_users view doesn't expose it
          // Server-side validation needed for proper security
        }));
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      if (import.meta.env?.DEV) console.error("Error loading questions:", error);
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  if (!lesson) return null;

  const handleStartQuiz = () => {
    setCurrentPhase("quiz");
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    try {
      // Validate answers server-side for security
      const { data, error } = await supabase.functions.invoke('validate-quiz', {
        body: {
          lessonId: lesson.id,
          answers: selectedAnswers.map((answer, index) => ({
            questionId: questions[index].id,
            userAnswer: answer,
          })),
        },
      });

      if (error) {
        if (import.meta.env?.DEV) console.error('Quiz validation error:', error);
        toast({
          title: "Erro ao validar quiz",
          description: "Ocorreu um erro ao validar suas respostas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const { correctCount, totalQuestions, score, passed } = data;
      
      setQuizResult({ score, passed, correctCount });
      setShowResults(true);
      
      if (passed) {
        // Celebration animation
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b"],
        });
        
        toast({
          title: "Parabéns! 🎉",
          description: `Você acertou ${correctCount}/${totalQuestions} questões (${score.toFixed(0)}%)`,
        });
        onComplete(lesson.id, true);
      } else {
        toast({
          title: "Continue tentando! 💪",
          description: `Você acertou ${correctCount}/${totalQuestions} questões (${score.toFixed(0)}%). Tente novamente!`,
          variant: "destructive",
        });
      }
    } catch (err) {
      if (import.meta.env?.DEV) console.error('Unexpected error during quiz validation:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao validar o quiz. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCurrentPhase("content");
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuestions([]);
    setIsLoadingQuestions(false);
    setQuizResult(null);
    onClose();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const score = quizResult?.score || 0;
  const correctAnswersCount = quizResult?.correctCount || 0;

  // Use video_url from lesson data and prepare playback source
  const videoUrlPath = lesson.video_url || lesson.videoUrl;
  const isYouTube = !!videoUrlPath && (videoUrlPath.includes('youtube.com') || videoUrlPath.includes('youtu.be'));
  const embedUrl = isYouTube && videoUrlPath ? convertToEmbedUrl(videoUrlPath) : null;
  const externalLink = lesson.external_link || lesson.contentUrl;

  return (
    <>
      {/* Lesson Notes - Only visible when modal is open and userId is provided */}
      {isOpen && userId && lesson && (
        <LessonNotes lessonId={lesson.id} userId={userId} />
      )}
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl mx-auto bg-card border-2 border-border shadow-strong rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{lesson.title}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {lesson.description || "Conteúdo da lição interativa"}
          </DialogDescription>
        </DialogHeader>

        {currentPhase === "content" && (
          <div className="space-y-6">
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                {isYouTube && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full rounded-xl"
                    allowFullScreen
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : signedVideoUrl ? (
                  <video
                    src={signedVideoUrl}
                    className="w-full h-full rounded-xl"
                    controls
                  />
                ) : externalLink ? (
                  <div className="text-center">
                    <ExternalLink className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground mb-4">Conteúdo externo</p>
                    <Button asChild className="bg-gradient-primary">
                      <a href={externalLink} target="_blank" rel="noopener noreferrer">
                        Acessar Conteúdo
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
                  </div>
                )}
            </div>

            {lesson.description && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              </div>
            )}
            
            <div className="text-center">
              {isLoadingQuestions ? (
                <p className="text-sm text-muted-foreground mb-4">Carregando questões...</p>
              ) : questions.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Após assistir o conteúdo, responda as {questions.length} questões para continuar
                  </p>
                  <Button onClick={handleStartQuiz} className="bg-gradient-primary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Iniciar Quiz
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta lição não possui questões. Clique em concluir para prosseguir.
                  </p>
                  <Button 
                    onClick={() => onComplete(lesson.id, true)} 
                    className="bg-gradient-primary"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Lição
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {currentPhase === "quiz" && !showResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-primary/20">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </Badge>
              <div className="w-32 bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                      className={`w-full text-left justify-start h-auto p-4 ${
                        selectedAnswers[currentQuestionIndex] === index 
                          ? "bg-gradient-primary border-primary/20" 
                          : "border-border hover:border-primary/20"
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="border-border hover:border-primary/20"
              >
                Anterior
              </Button>
              
              <Button 
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="bg-gradient-primary"
              >
                {currentQuestionIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
              </Button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="text-center space-y-6">
            <div className={`p-6 rounded-xl ${score >= 80 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              {score >= 80 ? (
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              ) : (
                <X className="h-16 w-16 mx-auto mb-4 text-red-500" />
              )}
              
              <h3 className="text-2xl font-bold mb-2">
                {score >= 80 ? "Parabéns!" : "Quase lá!"}
              </h3>
              
              <p className="text-lg mb-2">
                Você acertou {correctAnswersCount} de {questions.length} questões
              </p>
              
              <Badge variant={score >= 80 ? "default" : "destructive"} className="text-lg px-4 py-2">
                {score.toFixed(0)}%
              </Badge>
              
              <p className="text-sm text-muted-foreground mt-4">
                {score >= 80 
                  ? "Você pode avançar para a próxima lição!" 
                  : "Você precisa acertar pelo menos 80% para continuar."
                }
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              {score < 80 && (
                <Button 
                  onClick={() => {
                    setCurrentPhase("quiz");
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers([]);
                    setShowResults(false);
                  }}
                  className="bg-gradient-primary"
                >
                  Tentar Novamente
                </Button>
              )}
              
              <Button variant="outline" onClick={handleClose} className="border-border hover:border-primary/20">
                Fechar
              </Button>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
};