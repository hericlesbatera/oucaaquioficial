/**
 * Otimizador de imagens para upload
 * Comprime imagens antes de fazer upload
 */

export const compressImage = async (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Calcular novas dimensões mantendo aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                
                // Criar canvas e desenhar imagem comprimida
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para blob
                canvas.toBlob(
                    (blob) => {
                        // Criar novo File com a imagem comprimida
                        const compressedFile = new File(
                            [blob],
                            file.name,
                            { type: 'image/jpeg', lastModified: Date.now() }
                        );
                        
                        // Log do tamanho comprimido
                        const originalSize = (file.size / 1024 / 1024).toFixed(2);
                        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
                        console.log(`Imagem comprimida: ${originalSize}MB → ${compressedSize}MB`);
                        
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
};

export const optimizeImageUrl = (url) => {
    if (!url) return '/images/default-album.png';
    
    // Se for URL do Supabase, adicionar transformações
    if (url.includes('supabase')) {
        // Adicionar width/height query params se suportado
        return url;
    }
    
    return url;
};
