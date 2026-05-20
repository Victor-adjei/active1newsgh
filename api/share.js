export default async function handler(req, res) {
  const { story } = req.query;

  if (!story) {
    return res.redirect('/');
  }

  try {
    const supabaseUrl = 'https://ymvbgydxdtpodiuqvfgj.supabase.co';
    const supabaseKey = 'sb_publishable_fVUQi5fULk173enaoK138g_vDjLvIzR';

    // Fetch the article details from Supabase using REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/articles?timestamp=eq.${story}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const articles = await response.json();

    if (articles && articles.length > 0) {
      const article = articles[0];
      const title = escapeHtml(article.title);
      const description = escapeHtml(truncateString(article.content, 150));
      
      let imageUrl = article.mediaUrl || 'https://active1newsgh.com/logo.png';
      // WhatsApp and Facebook DO NOT support base64 images. Ensure it's absolute URL.
      if (imageUrl.startsWith('data:')) {
          imageUrl = 'https://active1newsgh.com/logo.png';
      } else if (!imageUrl.startsWith('http')) {
          imageUrl = `https://active1newsgh.com/${imageUrl.replace(/^\//, '')}`;
      }
      
      const shareUrl = `https://active1newsgh.com/?story=${story}`;
      const redirectUrl = `/?client=1&story=${story}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} | Active1NewsGH</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Active1NewsGH" />
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <!-- Fallback Redirect for safety -->
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">${title}</a>...</p>
  <script>
      window.location.replace("${redirectUrl}");
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error("OG Generator Error:", error);
  }

  // Fallback redirect if something went wrong
  return res.redirect(`/?story=${story}`);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncateString(str, num) {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}
