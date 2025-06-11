# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image optimization in the Travel Itinerary Builder application.

## Why Cloudinary?

The application uses Cloudinary for:
- **Automatic Image Optimization**: WebP format when supported, quality optimization
- **Responsive Images**: Generate multiple sizes on-the-fly
- **External Image Transformation**: Transform images from Unsplash and other sources
- **Network-Aware Loading**: Adjust quality based on connection speed
- **Progressive Enhancement**: Low-quality placeholders that enhance to full quality

## Getting Started

### 1. Create a Free Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Complete registration

The free tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- Generous transformation limits

### 2. Get Your Credentials

1. Log in to your Cloudinary Dashboard
2. Find your credentials at the top of the dashboard:
   - **Cloud Name**: Your unique identifier
   - **API Key**: Public key for uploads
   - **API Secret**: Secret key (keep secure!)

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Update Vercel Environment

If using Vercel:

```bash
# Use the setup script
npm run vercel:setup

# Or manually add each variable
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
```

## Configuration Options

### Demo Mode (Default)

If no Cloudinary credentials are provided, the app runs in demo mode:
- Uses Cloudinary's demo account
- Limited transformations
- Suitable for development/testing
- No account needed

### Production Mode

With credentials configured:
- Full transformation capabilities
- Your own storage and bandwidth
- Custom upload presets
- Advanced features available

## How It Works

### 1. Adaptive Image Component

The `AdaptiveImage` component automatically:
- Detects network conditions
- Chooses appropriate quality
- Loads progressive placeholders
- Optimizes format (WebP when supported)

```tsx
<AdaptiveImage
  src="https://images.unsplash.com/photo-123"
  alt="Travel destination"
  width={800}
  height={600}
/>
```

### 2. Image Transformations

Cloudinary URLs are generated with transformations:

```
https://res.cloudinary.com/your-cloud/image/fetch/
  f_auto,q_auto:good,w_800,h_600,c_fill/
  https://external-image-url.jpg
```

- `f_auto`: Automatic format selection
- `q_auto`: Automatic quality optimization
- `w_800,h_600`: Responsive sizing
- `c_fill`: Smart cropping

### 3. Network Detection

The app adjusts quality based on connection:
- **4G/WiFi**: High quality
- **3G**: Medium quality
- **2G/Slow**: Low quality
- **Save-Data**: Minimum quality

## Advanced Features

### Upload Presets (Optional)

Create upload presets in Cloudinary Dashboard:
1. Settings → Upload
2. Add upload preset
3. Configure transformations
4. Use in your app

### Lazy Loading

All images use Intersection Observer for lazy loading:
- Images load only when near viewport
- Reduces initial page load
- Improves performance scores

### Responsive Images

The component generates srcset automatically:
```html
<img srcset="
  image-400w.jpg 400w,
  image-800w.jpg 800w,
  image-1200w.jpg 1200w
" />
```

## Monitoring Usage

Track your usage in Cloudinary Dashboard:
- Dashboard → Usage
- Monitor bandwidth
- Check transformation count
- Set up alerts

## Troubleshooting

### Images Not Loading
1. Check cloud name is correct
2. Verify credentials in environment
3. Check browser console for errors
4. Ensure URLs are properly encoded

### Slow Transformations
1. Use fetch mode for external images
2. Enable aggressive caching
3. Preload critical images
4. Consider upload vs fetch trade-offs

### Hitting Limits
1. Check usage in dashboard
2. Optimize transformation parameters
3. Implement caching strategy
4. Consider upgrading plan

## Best Practices

1. **Use Fetch Mode**: For external images (Unsplash, etc.)
2. **Cache Aggressively**: Cloudinary provides long cache headers
3. **Optimize Sizes**: Only request sizes you need
4. **Monitor Usage**: Check dashboard regularly
5. **Lazy Load**: Use intersection observer for off-screen images

## Security Notes

- Never expose API Secret in client code
- Use unsigned uploads sparingly
- Configure allowed domains for fetch mode
- Set up webhook notifications for uploads

## Next Steps

1. Test image loading in development
2. Monitor Core Web Vitals improvements
3. Set up custom transformations if needed
4. Configure upload presets for user content
5. Implement image upload features (if required)

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Image Optimization Best Practices](https://cloudinary.com/documentation/image_optimization)
- [Responsive Images Guide](https://cloudinary.com/documentation/responsive_images)
- [Free Tier Limits](https://cloudinary.com/pricing)