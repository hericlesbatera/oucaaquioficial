import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'Ouça Aqui',
  domain = 'www.oucaaqui.com'
}) => {
  const fullTitle = title ? `${title}` : 'Ouça Aqui - O Melhor da Música Você Encontra Aqui';
  const fullDescription = description || 'Baixe e ouça grátis as melhores músicas de forró, piseiro, arrocha e muito mais!';
  const fullImage = image || '/images/og-default.jpg';
  const fullUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      
      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:domain" content={domain} />
    </Helmet>
  );
};

export default SEO;
