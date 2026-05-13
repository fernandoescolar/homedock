import { getDailyBackgroundUrl } from '../../utils/backgrounds';
import type { BackgroundConfig } from '../../types';
import './Background.css';

interface BackgroundProps {
  config: BackgroundConfig;
}

export function Background({ config }: BackgroundProps) {
  const dailyUrl = getDailyBackgroundUrl();
  const imageUrl = config.mode === 'daily'
    ? dailyUrl
    : config.mode === 'image' && config.imageUrl
      ? config.imageUrl
      : null;

  const backgroundImage = config.mode === 'gradient'
    ? `linear-gradient(${config.gradientAngle}deg, ${config.gradientFrom}, ${config.gradientTo})`
    : imageUrl
      ? `url(${imageUrl})`
      : 'none';

  const backgroundColor = config.mode === 'solid' ? config.solidColor : '#0f172a';

  return (
    <div
      className="background"
      style={{
        backgroundImage,
        backgroundColor,
      }}
      aria-hidden="true"
    />
  );
}
