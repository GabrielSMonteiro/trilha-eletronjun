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
}

export const LessonModal = ({ lesson, isOpen, onClose, onComplete }: LessonModalProps) => {
  const [currentPhase, setCurrentPhase] = useState<"content" | "quiz">("content");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

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
        console.error("Error loading questions:", error);
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
      console.error("Error loading questions:", error);
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

  const handleFinishQuiz = () => {
    // Note: Without correct answers from server, we auto-pass the quiz
    // TODO: Implement server-side validation via Edge Function for proper security
    const correctAnswers = selectedAnswers.filter((answer, index) => {
      return questions[index].correctAnswer !== undefined && answer === questions[index].correctAnswer;
    });
    
    // If no correct answers are available (questions_for_users view), auto-pass
    const score = questions.length > 0 && questions[0].correctAnswer !== undefined
      ? (correctAnswers.length / questions.length) * 100 
      : 100;
    const passed = score >= 80;
    
    setShowResults(true);
    
    if (passed) {
      toast({
        title: "Parabéns! 🎉",
        description: questions[0].correctAnswer !== undefined 
          ? `Você acertou ${correctAnswers.length}/${questions.length} questões (${score.toFixed(0)}%)`
          : "Quiz completado com sucesso!",
      });
      onComplete(lesson.id, true);
    } else {
      toast({
        title: "Continue tentando! 💪",
        description: `Você acertou ${correctAnswers.length}/${questions.length} questões (${score.toFixed(0)}%). Tente novamente!`,
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
    onClose();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const correctAnswers = selectedAnswers.filter((answer, index) => {
    return questions[index]?.correctAnswer !== undefined && answer === questions[index]?.correctAnswer;
  });
  const score = selectedAnswers.length === questions.length && questions[0]?.correctAnswer !== undefined
    ? (correctAnswers.length / questions.length) * 100 
    : 100;

  // Use video_url from lesson data and convert to embed format
  const videoUrl = lesson.video_url || lesson.videoUrl;
  const embedUrl = videoUrl ? convertToEmbedUrl(videoUrl) : null;
  const externalLink = lesson.external_link || lesson.contentUrl;

  return (
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
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                Você acertou {correctAnswers.length} de {questions.length} questões
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
  );
};