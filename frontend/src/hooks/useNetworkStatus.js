import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

/**
 * Hook para monitorar status da conexão de internet
 * @returns {{ isOnline: boolean, isLoading: boolean }}
 */
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe = null;

        const initNetworkStatus = async () => {
            try {
                // Verificar status inicial
                const status = await Network.getStatus();
                setIsOnline(status.connected);
                setIsLoading(false);
                console.log('🌐 Internet status inicial:', status.connected ? 'Online' : 'Offline');

                // Monitorar mudanças de conexão (only on native)
                if (window.Capacitor?.isNativePlatform?.()) {
                    unsubscribe = Network.addListener('networkStatusChange', (status) => {
                        setIsOnline(status.connected);
                        console.log('🌐 Status da internet mudou:', status.connected ? 'Online' : 'Offline');
                    });
                }
            } catch (error) {
                console.warn('Erro ao verificar status de internet:', error);
                setIsLoading(false);
                // Assumir online em caso de erro
                setIsOnline(true);
            }
        };

        initNetworkStatus();

        return () => {
            if (unsubscribe) {
                unsubscribe.remove();
            }
        };
    }, []);

    return { isOnline, isLoading };
};

export default useNetworkStatus;
