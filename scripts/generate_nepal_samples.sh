#!/usr/bin/env bash
set -e

mkdir -p /tmp/nepal_assets
mkdir -p public/samples dist/samples public/audio dist/audio

echo "Fetching high-res photography of Nepal..."
curl -s -L "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85" -o /tmp/nepal_assets/everest.jpg
curl -s -L "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=85" -o /tmp/nepal_assets/durbar.jpg
curl -s -L "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85" -o /tmp/nepal_assets/phewa.jpg

echo "Rendering Everest Sunrise Video..."
ffmpeg -y -loop 1 -i /tmp/nepal_assets/everest.jpg \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 10 \
  -vf "scale=1920:1080,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=300:s=1280x720:fps=30" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -profile:v high -level 4.0 -movflags +faststart \
  -c:a aac -b:a 128k \
  public/samples/everest_sunrise.mp4

ffmpeg -y -ss 00:00:02 -i public/samples/everest_sunrise.mp4 -frames:v 1 -q:v 2 public/samples/everest_sunrise_thumb.jpg

echo "Rendering Durbar Square Video..."
ffmpeg -y -loop 1 -i /tmp/nepal_assets/durbar.jpg \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 10 \
  -vf "scale=1920:1080,zoompan=z='min(zoom+0.0012,1.2)':x='(iw-iw/zoom)*(on/300)':y='ih/2-(ih/zoom/2)':d=300:s=1280x720:fps=30" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -profile:v high -level 4.0 -movflags +faststart \
  -c:a aac -b:a 128k \
  public/samples/durbar_square.mp4

ffmpeg -y -ss 00:00:02 -i public/samples/durbar_square.mp4 -frames:v 1 -q:v 2 public/samples/durbar_square_thumb.jpg

echo "Rendering Phewa Lake Video..."
ffmpeg -y -loop 1 -i /tmp/nepal_assets/phewa.jpg \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 10 \
  -vf "scale=1920:1080,zoompan=z='if(lte(zoom,1.0),1.2,max(1.001,zoom-0.0012))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=300:s=1280x720:fps=30" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -profile:v high -level 4.0 -movflags +faststart \
  -c:a aac -b:a 128k \
  public/samples/phewa_lake.mp4

ffmpeg -y -ss 00:00:02 -i public/samples/phewa_lake.mp4 -frames:v 1 -q:v 2 public/samples/phewa_lake_thumb.jpg

echo "Generating Audio tracks..."
ffmpeg -y -f lavfi -i "sine=frequency=220:sample_rate=44100:duration=30" -af "volume=0.2" -c:a mp3 public/audio/himalayan_breeze.mp3
ffmpeg -y -f lavfi -i "sine=frequency=330:sample_rate=44100:duration=30" -af "volume=0.2" -c:a mp3 public/audio/kathmandu_beats.mp3
ffmpeg -y -f lavfi -i "sine=frequency=440:sample_rate=44100:duration=30" -af "volume=0.2" -c:a mp3 public/audio/temple_bells.mp3

echo "Syncing to dist/..."
cp -r public/samples/* dist/samples/ 2>/dev/null || true
cp -r public/audio/* dist/audio/ 2>/dev/null || true

echo "All samples generated successfully!"
