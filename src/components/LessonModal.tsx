import { useState, useEffect, useCallback } from "react";
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
import { CheckCircle, X, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import LessonNotesPanel from "@/components/LessonNotesPanel";

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
  awardXP?: (amount: number, reason: string, lessonId?: string) => Promise<void>;
  updateStreak?: () => Promise<void>;
}

export const LessonModal = ({ lesson, isOpen, onClose, onComplete, userId, awardXP, updateStreak }: LessonModalProps) => {
  const [currentPhase, setCurrentPhase] = useState<"content" | "quiz">("content");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correctCount: number } | null>(null);
  
  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const isMobile = useIsMobile();

  // Load questions and notes when lesson changes
  useEffect(() => {
    if (lesson?.id && isOpen) {
      loadQuestions();
      if (userId) {
        loadNotes();
      }
    }
  }, [lesson?.id, isOpen]);

  // Reset notes when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNotes("");
      setShowNotes(false);
    }
  }, [isOpen]);

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

  const loadNotes = async () => {
    if (!lesson || !userId) return;
    
    try {
      const { data, error } = await supabase
        .from("lesson_notes" as any)
        .select("content")
        .eq("user_id", userId)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        if (import.meta.env?.DEV) console.error("Error loading notes:", error);
      } else if (data) {
        setNotes((data as any).content || "");
      }
    } catch (error) {
      if (import.meta.env?.DEV) console.error("Error loading notes:", error);
    }
  };

  const saveNotes = async () => {
    if (!lesson || !userId) return;
    
    setIsSavingNotes(true);
    try {
      const { error } = await supabase.from("lesson_notes" as any).upsert(
        {
          user_id: userId,
          lesson_id: lesson.id,
          content: notes,
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

      if (error) {
        if (import.meta.env?.DEV) console.error("Error saving notes:", error);
        toast({
          title: "Erro",
          description: "Erro ao salvar anotações.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Salvo!",
          description: "Suas anotações foram salvas.",
        });
      }
    } catch (error) {
      if (import.meta.env?.DEV) console.error("Error saving notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
  }, []);

  const handleCloseNotes = useCallback(() => {
    setShowNotes(false);
  }, []);

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
        
        // Award XP based on performance
        if (awardXP) {
          const baseXP = 50; // Base XP for completing a lesson
          const perfectBonus = score === 100 ? 50 : 0; // Bonus for perfect score
          const totalXP = baseXP + perfectBonus;
          
          await awardXP(
            totalXP,
            score === 100 ? 'Pontuação perfeita na lição!' : 'Lição completada!',
            lesson.id
          );
        }
        
        // Update streak
        if (updateStreak) {
          await updateStreak();
        }
        
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

  // Use video_url from lesson data
  const videoUrl = lesson?.video_url || lesson?.videoUrl;
  const externalLink = lesson?.external_link || lesson?.contentUrl;

  const currentQuestion = questions[currentQuestionIndex];
  const score = quizResult?.score || 0;
  const correctAnswersCount = quizResult?.correctCount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`mx-auto bg-card border-2 border-border shadow-strong rounded-2xl max-h-[90vh] overflow-y-auto ${showNotes && !isMobile ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between pr-8">
            <span className="truncate">{lesson?.title}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {userId && currentPhase === "content" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowNotes(!showNotes)}
                  className={`border-amber-500/50 hover:bg-amber-500/10 ${showNotes ? 'bg-amber-500/10' : ''}`}
                >
                  <Pencil className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="hidden sm:inline">Anotações</span>
                  {!isMobile && (showNotes ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 ml-1" />)}
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {lesson?.description || "Conteúdo da lição interativa"}
          </DialogDescription>
        </DialogHeader>

        {currentPhase === "content" && (
          <div className={`${showNotes && !isMobile ? 'grid grid-cols-[1fr_320px] gap-4' : ''}`}>
            <div className="space-y-6">
              {/* Adaptive Video Player */}
              <VideoPlayer 
                url={videoUrl} 
                externalLink={externalLink} 
                title={lesson?.title} 
              />

              {lesson?.description && (
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
                      onClick={() => lesson && onComplete(lesson.id, true)} 
                      className="bg-gradient-primary"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Concluir Lição
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Notes Panel - Desktop inline */}
            {showNotes && !isMobile && (
              <div className="border-l border-border pl-4">
                <LessonNotesPanel
                  notes={notes}
                  onNotesChange={handleNotesChange}
                  onSave={saveNotes}
                  isSaving={isSavingNotes}
                />
              </div>
            )}
          </div>
        )}

        {/* Notes Panel - Mobile overlay */}
        {showNotes && isMobile && currentPhase === "content" && (
          <div 
            className="fixed inset-0 bg-background p-4 animate-fade-in"
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <LessonNotesPanel
              notes={notes}
              onNotesChange={handleNotesChange}
              onSave={saveNotes}
              isSaving={isSavingNotes}
              isMobile={true}
              onClose={handleCloseNotes}
            />
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
    );
  };