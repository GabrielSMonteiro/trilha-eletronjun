import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresetManager } from '@/components/cafe/PresetManager';
import { cafeService } from '@/services/cafeService';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

vi.mock('@/services/cafeService', () => ({
  cafeService: {
    loadUserPresets: vi.fn(),
    savePreset: vi.fn(),
    deletePreset: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const mockPresets = [
  {
    id: 'p1',
    name: 'Foco Total',
    description: 'Apenas ruído branco',
    soundLevels: { 'white-noise': 0.8 },
    isDefault: false,
    userId: 'user1'
  }
];

describe('PresetManager', () => {
  const mockOnLoadPreset = vi.fn();
  const mockGetCurrentConfig = vi.fn().mockReturnValue({ soundLevels: { chuva: 0.5 } });

  beforeEach(() => {
    vi.clearAllMocks();
    (cafeService.loadUserPresets as any).mockResolvedValue(mockPresets);
  });

  it('renderiza os botões e carrega presets do usuário', async () => {
    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);
    
    expect(screen.getByText('Presets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Foco Total')).toBeInTheDocument();
      expect(screen.getByText('Apenas ruído branco')).toBeInTheDocument();
    });
  });

  it('permite abrir modal e salvar um novo preset', async () => {
    const user = userEvent.setup();
    (cafeService.savePreset as any).mockResolvedValue({
      id: 'p2',
      name: 'Novo Preset',
      description: 'Teste de salvamento',
      soundLevels: { chuva: 0.5 },
      isDefault: false,
      userId: 'user1'
    });

    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    
    expect(await screen.findByText('Salvar Preset', { selector: 'h2' })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Meu preset favorito');
    await user.type(nameInput, 'Novo Preset');

    const descInput = screen.getByPlaceholderText('Para quando preciso de foco total...');
    await user.type(descInput, 'Teste de salvamento');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Preset' }));

    await waitFor(() => {
      expect(cafeService.savePreset).toHaveBeenCalledWith({
        name: 'Novo Preset',
        description: 'Teste de salvamento',
        soundLevels: { chuva: 0.5 },
        isDefault: false
      });
      expect(toast.success).toHaveBeenCalledWith('Preset salvo com sucesso!');
      expect(screen.getByText('Novo Preset')).toBeInTheDocument();
    });
  });

  it('exibe erro ao tentar salvar preset sem nome', async () => {
    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    expect(await screen.findByText('Salvar Preset', { selector: 'h2' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Preset' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Digite um nome para o preset');
      expect(cafeService.savePreset).not.toHaveBeenCalled();
    });
  });

  it('exibe erro caso serviço de salvar falhe', async () => {
    const user = userEvent.setup();
    (cafeService.savePreset as any).mockResolvedValue(null); 

    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    expect(await screen.findByText('Salvar Preset', { selector: 'h2' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Meu preset favorito'), 'Falha');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Preset' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar preset');
    });
  });

  it('permite deletar um preset do usuário', async () => {
    (cafeService.deletePreset as any).mockResolvedValue(true);

    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    await waitFor(() => {
      expect(screen.getByText('Foco Total')).toBeInTheDocument();
    });

    const item = screen.getByText('Foco Total').closest('.flex');
    const deleteBtn = item?.querySelectorAll('button')[1]; 
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    await waitFor(() => {
      expect(cafeService.deletePreset).toHaveBeenCalledWith('p1');
      expect(toast.success).toHaveBeenCalledWith('Preset removido');
      expect(screen.queryByText('Foco Total')).not.toBeInTheDocument();
    });
  });

  it('exibe erro ao falhar ao deletar preset', async () => {
    (cafeService.deletePreset as any).mockResolvedValue(false);

    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    await waitFor(() => {
      expect(screen.getByText('Foco Total')).toBeInTheDocument();
    });

    const item = screen.getByText('Foco Total').closest('.flex');
    const deleteBtn = item?.querySelectorAll('button')[1];
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao remover preset');
      expect(screen.getByText('Foco Total')).toBeInTheDocument();
    });
  });

  it('permite carregar um preset clicando nele', async () => {
    render(<PresetManager onLoadPreset={mockOnLoadPreset} getCurrentConfig={mockGetCurrentConfig} />);

    await waitFor(() => {
      expect(screen.getByText('Foco Total')).toBeInTheDocument();
    });

    const item = screen.getByText('Foco Total').closest('.flex');
    const downloadBtn = item?.querySelectorAll('button')[0]; 
    if (downloadBtn) {
      fireEvent.click(downloadBtn);
    }

    expect(mockOnLoadPreset).toHaveBeenCalledWith(mockPresets[0]);
  });
});
