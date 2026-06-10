import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AuthBackgroundCarousel from '@/components/auth/AuthBackgroundCarousel';

const { mockOrder, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockOrder, mockEq, mockSelect, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

const images = [
  { id: '1', image_url: 'https://example.com/img1.jpg', title: 'Imagem 1', display_order: 1 },
  { id: '2', image_url: 'https://example.com/img2.jpg', title: 'Imagem 2', display_order: 2 },
  { id: '3', image_url: 'https://example.com/img3.jpg', title: null, display_order: 3 },
];

describe('AuthBackgroundCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a black background while loading', () => {
    
    mockOrder.mockReturnValue(new Promise(() => {}));

    const { container } = render(<AuthBackgroundCarousel />);
    const bg = container.querySelector('.absolute.inset-0.bg-black');
    expect(bg).toBeInTheDocument();
  });

  it('shows a black background when no images are returned', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { container } = await act(async () => render(<AuthBackgroundCarousel />));
    const bg = container.querySelector('.absolute.inset-0.bg-black');
    expect(bg).toBeInTheDocument();
  });

  it('shows a black background when Supabase returns an error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { container } = await act(async () => render(<AuthBackgroundCarousel />));
    const bg = container.querySelector('.absolute.inset-0.bg-black');
    expect(bg).toBeInTheDocument();
  });

  it('renders all images when data is returned', async () => {
    mockOrder.mockResolvedValue({ data: images, error: null });

    await act(async () => render(<AuthBackgroundCarousel />));

    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/img1.jpg');
    expect(imgs[0]).toHaveAttribute('alt', 'Imagem 1');
  });

  it('uses "Background" alt text for images with null title', async () => {
    mockOrder.mockResolvedValue({ data: images, error: null });

    await act(async () => render(<AuthBackgroundCarousel />));

    const imgs = screen.getAllByRole('img');
    expect(imgs[2]).toHaveAttribute('alt', 'Background'); 
  });

  it('advances to the next image after 5 seconds', async () => {
    mockOrder.mockResolvedValue({ data: images, error: null });

    const { container } = await act(async () => render(<AuthBackgroundCarousel />));

    const allSlides = container.querySelectorAll('.absolute.inset-0.transition-opacity');
    expect(allSlides[0].classList.contains('opacity-100')).toBe(true);
    expect(allSlides[1].classList.contains('opacity-0')).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(allSlides[1].classList.contains('opacity-100')).toBe(true);
    expect(allSlides[0].classList.contains('opacity-0')).toBe(true);
  });

  it('wraps back to first image after cycling through all', async () => {
    mockOrder.mockResolvedValue({ data: images, error: null });

    const { container } = await act(async () => render(<AuthBackgroundCarousel />));
    const allSlides = container.querySelectorAll('.absolute.inset-0.transition-opacity');

    await act(async () => {
      vi.advanceTimersByTime(15000); 
    });

    expect(allSlides[0].classList.contains('opacity-100')).toBe(true);
  });

  it('does not start the auto-advance timer when only one image', async () => {
    mockOrder.mockResolvedValue({ data: [images[0]], error: null });

    const { container } = await act(async () => render(<AuthBackgroundCarousel />));

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    const allSlides = container.querySelectorAll('.absolute.inset-0.transition-opacity');
    expect(allSlides).toHaveLength(1);
    expect(allSlides[0].classList.contains('opacity-100')).toBe(true);
  });
});
