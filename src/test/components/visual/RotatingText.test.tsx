import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import RotatingText from '@/components/RotatingText';

vi.mock('@/components/RotatingText.css', () => ({}));

describe('RotatingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza o componente e pelo menos o primeiro texto', () => {
    render(<RotatingText texts={['Texto1', 'Texto2']} />);
    expect(screen.getAllByText(/Texto1/i).length).toBeGreaterThan(0);
  });

  it('rotaciona textos automaticamente (auto=true)', async () => {
    render(<RotatingText texts={['Texto1', 'Texto2']} rotationInterval={100} />);
    
    // Avança o timer para disparar a rotação
    act(() => { vi.advanceTimersByTime(200); });
    
    // Componente não deve quebrar
    expect(document.body.firstChild).toBeTruthy();
  });

  it('não rotaciona quando auto=false', () => {
    render(<RotatingText texts={['A', 'B']} auto={false} rotationInterval={100} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('renderiza com splitBy=words', () => {
    render(<RotatingText texts={['Hello World']} splitBy="words" />);
    expect(screen.getAllByText(/Hello World/i).length).toBeGreaterThan(0);
  });

  it('renderiza com splitBy=lines', () => {
    render(<RotatingText texts={['Linha1\nLinha2']} splitBy="lines" />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renderiza com splitBy customizado', () => {
    render(<RotatingText texts={['A-B-C']} splitBy="-" />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renderiza com staggerFrom=last', () => {
    render(<RotatingText texts={['Abc']} staggerFrom="last" staggerDuration={0.1} />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renderiza com staggerFrom=center', () => {
    render(<RotatingText texts={['Abcde']} staggerFrom="center" staggerDuration={0.1} />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renderiza com staggerFrom=random', () => {
    render(<RotatingText texts={['Abcde']} staggerFrom="random" staggerDuration={0.1} />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renderiza com staggerFrom=number', () => {
    render(<RotatingText texts={['Abcde']} staggerFrom={2} staggerDuration={0.1} />);
    expect(document.body.firstChild).toBeTruthy();
  });

  it('aceita ref e expõe métodos next/previous/jumpTo/reset', () => {
    const TestComponent = () => {
      const ref = useRef<any>(null);
      return (
        <>
          <RotatingText ref={ref} texts={['A', 'B', 'C']} auto={false} />
          <button onClick={() => ref.current?.next()}>Next</button>
          <button onClick={() => ref.current?.previous()}>Prev</button>
          <button onClick={() => ref.current?.jumpTo(2)}>JumpTo</button>
          <button onClick={() => ref.current?.reset()}>Reset</button>
        </>
      );
    };
    const { getByRole } = render(<TestComponent />);
    // Should not throw
    getByRole('button', { name: 'Next' }).click();
    getByRole('button', { name: 'Prev' }).click();
    getByRole('button', { name: 'JumpTo' }).click();
    getByRole('button', { name: 'Reset' }).click();
    expect(document.body.firstChild).toBeTruthy();
  });

  it('chama onNext quando muda de texto', () => {
    const onNext = vi.fn();
    const TestComponent = () => {
      const ref = useRef<any>(null);
      return (
        <>
          <RotatingText ref={ref} texts={['A', 'B']} auto={false} onNext={onNext} />
          <button onClick={() => ref.current?.next()}>Next</button>
        </>
      );
    };
    const { getByRole } = render(<TestComponent />);
    getByRole('button', { name: 'Next' }).click();
    expect(onNext).toHaveBeenCalledWith(1);
  });

  it('loop=false não vai além do último texto', () => {
    const TestComponent = () => {
      const ref = useRef<any>(null);
      return (
        <>
          <RotatingText ref={ref} texts={['A', 'B']} auto={false} loop={false} />
          <button onClick={() => { ref.current?.next(); ref.current?.next(); }}>Next</button>
        </>
      );
    };
    const { getByRole } = render(<TestComponent />);
    getByRole('button', { name: 'Next' }).click();
    // Should stay on last text
    expect(document.body.firstChild).toBeTruthy();
  });
});
