import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@smwb/summer-ui';
import styles from './ErrorBoundary.module.less';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route error boundary caught:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className={styles.container} role="alert">
        <h1 className={styles.title}>Что-то пошло не так</h1>
        <p className={styles.message}>
          {this.state.error.message || 'Неизвестная ошибка'}
        </p>
        <div className={styles.actions}>
          <Button onClick={this.reset}>Попробовать снова</Button>
          <Button variant="text" onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </Button>
        </div>
      </div>
    );
  }
}
