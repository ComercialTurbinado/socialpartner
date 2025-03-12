import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Instagram as InstagramIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { completeInstagramOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile, initiateInstagramOAuth } from '../utils/OAuthService';
import { storeSocialCredentials, getSocialCredentials, removeSocialCredentials } from '../utils/DatabaseService';
import InstagramAccountStatus from './InstagramAccountStatus';

interface InstagramPermission {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const InstagramConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [redirectUri] = useState(window.location.origin + '/instagram');
  
  // Use state for App ID and App Secret instead of environment variables
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  
  const [permissions] = useState<InstagramPermission[]>([
    {
      name: 'instagram_basic',
      description: 'Access to posts and basic profile information',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_content_publish',
      description: 'Ability to publish content to Instagram',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_manage_comments',
      description: 'Access comments and who commented on your posts',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_manage_insights',
      description: 'Access likes and who interacted with your posts',
      enabled: true,
      required: true
    }
  ]);


  // Check for existing token on component mount
  useEffect(() => {
    const loadProfile = async () => {
      // Try to get credentials from database first
      const dbProfile = await getSocialCredentials('instagram');
      
      if (dbProfile) {
        setConnected(true);
        setProfile(dbProfile);
        // Set the credentials in state so they're available if needed
        if (dbProfile.appId) setAppId(dbProfile.appId);
        if (dbProfile.appSecret) setAppSecret(dbProfile.appSecret);
        return;
      }
      
      // Fall back to localStorage if not in database
      const storedProfile = getStoredToken('instagram');
      if (storedProfile) {
        setConnected(true);
        setProfile(storedProfile);
        
        // Try to get stored credentials from localStorage
        const storedAppId = localStorage.getItem('instagram_app_id');
        const storedAppSecret = localStorage.getItem('instagram_app_secret');
        const storedAccessToken = localStorage.getItem('instagram_access_token');
        
        if (storedAppId) setAppId(storedAppId);
        if (storedAppSecret) setAppSecret(storedAppSecret);
        if (storedAccessToken) setAccessToken(storedAccessToken);
      }
    };
    
    loadProfile();
    
    // Check for OAuth code in URL (after redirect back from Instagram)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !connected) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se App ID e App Secret estão disponíveis
      if (!appId || !appSecret) {
        setError('App ID e App Secret são obrigatórios. Por favor, preencha os campos abaixo.');
        setLoading(false);
        return;
      }

      // Verify state parameter to prevent CSRF attacks
      const urlParams = new URLSearchParams(window.location.search);
      const returnedState = urlParams.get('state');
      const storedState = sessionStorage.getItem('instagram_oauth_state');
      
      if (!returnedState || !storedState || returnedState !== storedState) {
        throw new Error('Invalid state parameter. Authentication failed for security reasons.');
      }
      
      // Get the raw response from Instagram/Facebook API
      const rawResponse = await completeInstagramOAuth(code, appId, appSecret, redirectUri);
      
      // Check if we have an error in the response
      if (rawResponse.error) {
        console.log('Raw Instagram OAuth error:', rawResponse);
        
        // Check for the specific "authorization code has been used" error
        if (rawResponse.rawErrorResponse && 
            rawResponse.rawErrorResponse.error && 
            rawResponse.rawErrorResponse.error.message === "This authorization code has been used.") {
          setError('This authorization code has already been used. Please try connecting again with a new authorization code.');
          // Clean up the URL to remove the used code
          window.history.replaceState({}, document.title, window.location.pathname);
          sessionStorage.removeItem('instagram_oauth_state');
          return;
        }
        
        setError(JSON.stringify(rawResponse, null, 2));
        return;
      }
      
      // Check if we have an empty accounts array, which means no Instagram business account
      if (rawResponse.rawAccountsResponse && 
          rawResponse.rawAccountsResponse.data && 
          rawResponse.rawAccountsResponse.data.length === 0) {
        setError('No Instagram business account found. Please make sure you have a business or creator account connected to a Facebook page.');
        return;
      }
      
      // Add the App ID and App Secret to the profile for future use
      const profileWithCredentials = {
        ...rawResponse,
        appId,
        appSecret
      };
      
      // Store in database
      await storeSocialCredentials('instagram', profileWithCredentials);
      
      // Also store in localStorage for backward compatibility
      storeToken('instagram', profileWithCredentials);
      
      setProfile(profileWithCredentials);
      setConnected(true);
      
      // Clean up the URL and session storage
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('instagram_oauth_state');
    } catch (err: any) {
      console.error('Instagram OAuth callback error:', err);
      // Return the raw error without any processing
      setError(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se App ID e App Secret estão disponíveis
      if (!appId || !appSecret) {
        setError('App ID e App Secret são obrigatórios. Por favor, preencha os campos abaixo.');
        setLoading(false);
        return;
      }
      
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('instagram_app_id', appId);
      localStorage.setItem('instagram_app_secret', appSecret);
      
      // Se o token de acesso foi fornecido, tente conectar diretamente
      if (accessToken) {
        // Sanitize the token before storing it
        const sanitizedToken = accessToken.trim().replace(/["']/g, '');
        localStorage.setItem('instagram_access_token', sanitizedToken);
        await handleDirectConnect();
        return;
      }
      
      // Get selected permissions for Instagram Graph API
      const selectedPermissions = permissions
        .filter(p => p.enabled)
        .map(p => p.name);
      
      // Use the initiateInstagramOAuth function from OAuthService
      // This function handles adding required permissions and constructing the proper URL
      initiateInstagramOAuth(appId, redirectUri, selectedPermissions);
    } catch (err) {
      console.error('Instagram OAuth error:', err);
      setError('Failed to connect to Instagram. Please try again.');
      setLoading(false);
    }
  };

  const handleDirectConnect = async () => {
    try {
      // Verificar se temos o token de acesso
      if (!accessToken) {
        throw new Error('Token de acesso é obrigatório para conexão direta.');
      }
      
      // Sanitize the access token by trimming whitespace and removing any quotes
      const sanitizedToken = accessToken.trim().replace(/["']/g, '');
      
      console.log('Using sanitized token:', sanitizedToken);
      
      // Fazer uma requisição para a API Graph para verificar se o token é válido
      // e obter informações básicas do usuário
      await axios.get(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${sanitizedToken}`
      );

      // Se chegamos aqui, o token é válido
      // Agora vamos tentar obter as contas do Instagram associadas
      const accountsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );

      // Armazenar a resposta bruta das contas
      const rawAccountsResponse = accountsResponse.data;
      
      // Encontrar páginas com contas de negócios do Instagram
      const pages = rawAccountsResponse.data || [];
      let instagramBusinessAccountId = null;
      let username = '';
      let rawPageResponses = [];
      
      // Verificar cada página para uma conta de negócios do Instagram
      for (const page of pages) {
        try {
          // Solicitar mais campos para garantir que obtemos todos os dados da conta do Instagram
          const pageResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,name},connected_instagram_account{id,username,profile_picture_url,name}&access_token=${sanitizedToken}`
          );
          
          // Armazenar a resposta bruta da página
          rawPageResponses.push(pageResponse.data);
          
          // Verificar primeiro instagram_business_account (método preferido)
          if (pageResponse.data.instagram_business_account) {
            instagramBusinessAccountId = pageResponse.data.instagram_business_account.id;
            username = pageResponse.data.instagram_business_account.username;
            break;
          }
          
          // Alternativa para connected_instagram_account se a conta de negócios não for encontrada
          if (pageResponse.data.connected_instagram_account) {
            instagramBusinessAccountId = pageResponse.data.connected_instagram_account.id;
            username = pageResponse.data.connected_instagram_account.username;
            break;
          }
        } catch (err) {
          // Armazenar quaisquer erros nas respostas brutas
          rawPageResponses.push({ error: err });
          console.warn(`Não foi possível obter a conta de negócios do Instagram para a página ${page.id}:`, err);
        }
      }

      // Verificar se encontramos uma conta do Instagram
      if (!instagramBusinessAccountId) {
        throw new Error('Nenhuma conta de negócios do Instagram encontrada. Certifique-se de que você tem uma conta comercial ou de criador conectada a uma página do Facebook.');
      }

      // Criar o perfil com todas as informações necessárias
      const profileWithCredentials = {
        id: instagramBusinessAccountId,
        name: username,
        username: username,
        accessToken: sanitizedToken, // Use the sanitized token here
        appId,
        appSecret,
        rawAccountsResponse,
        rawPageResponses
      };
      
      // Armazenar no banco de dados
      await storeSocialCredentials('instagram', profileWithCredentials);
      
      // Também armazenar no localStorage para compatibilidade com versões anteriores
      storeToken('instagram', profileWithCredentials);
      
      setProfile(profileWithCredentials);
      setConnected(true);
      
      // Exibir mensagem de sucesso
      setError(null);
    } catch (err) {
      console.error('Erro na conexão direta com Instagram:', err);
      
      // Exibir mensagem de erro detalhada
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 'data' in err.response) {
        setError(`Erro na API do Instagram: ${JSON.stringify(err.response.data, null, 2)}`);
      } else if (err instanceof Error) {
        setError(`Falha ao conectar com o Instagram: ${err.message}`);
      } else {
        setError('Falha ao conectar com o Instagram: Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      // Remove stored token from database
      await removeSocialCredentials('instagram');
      
      // Also remove from localStorage for backward compatibility
      removeStoredToken('instagram');
      
      // Remove stored access token
      localStorage.removeItem('instagram_access_token');
      
      // Update state
      setConnected(false);
      setProfile(null);
      setAccessToken('');
      
      // Don't clear the credentials from state so they can be reused
    } catch (err) {
      setError('Failed to disconnect from Instagram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAppSecretVisibility = () => {
    setShowAppSecret(!showAppSecret);
  };

  const handleToggleAccessTokenVisibility = () => {
    setShowAccessToken(!showAccessToken);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InstagramIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4">Instagram Integration</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your Instagram account to manage your posts, engage with your audience, and track performance.
      </Typography>

      {error && (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          
          {error.includes('No Instagram business account found') && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                How to Fix This Issue:
              </Typography>
              <Typography variant="body2" paragraph>
                This error occurs because Instagram's API requires a business or creator account that is linked to a Facebook page.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Follow these steps to convert your Instagram account:
              </Typography>
              <ol>
                <li>
                  <Typography variant="body2">Open the Instagram app on your mobile device</Typography>
                </li>
                <li>
                  <Typography variant="body2">Go to your profile and tap the hamburger menu (≡) in the top right</Typography>
                </li>
                <li>
                  <Typography variant="body2">Tap Settings and privacy, then Account type and tools</Typography>
                </li>
                <li>
                  <Typography variant="body2">Select Switch to Professional Account and choose Business or Creator</Typography>
                </li>
                <li>
                  <Typography variant="body2">Follow the prompts to connect to your Facebook page</Typography>
                </li>
                <li>
                  <Typography variant="body2">If you don't have a Facebook page, you'll need to create one first</Typography>
                </li>
              </ol>
            </Paper>
          )}
          
          {error.includes('This authorization code has already been used') && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                How to Fix This Issue:
              </Typography>
              <Typography variant="body2" paragraph>
                This error occurs because the authorization code from Instagram can only be used once, and it appears this code has already been used.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Follow these steps to reconnect:
              </Typography>
              <ol>
                <li>
                  <Typography variant="body2">Click the "Connect with Instagram" button below to start a new authorization process</Typography>
                </li>
                <li>
                  <Typography variant="body2">You'll be redirected to Instagram/Facebook to authorize the application again</Typography>
                </li>
                <li>
                  <Typography variant="body2">After authorization, you'll be redirected back with a new, valid authorization code</Typography>
                </li>
              </ol>
            </Paper>
          )}
        </Box>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InstagramIcon color={connected ? "primary" : "disabled"} sx={{ mr: 1 }} />
              <Typography variant="h6">Instagram</Typography>
            </Box>
            <Box>
              <Button
                variant={connected ? 'outlined' : 'contained'}
                color={connected ? 'error' : 'primary'}
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={loading}
                startIcon={!loading && !connected ? <InstagramIcon /> : undefined}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : connected ? (
                  'Disconnect'
                ) : (
                  'Conectar Instagram'
                )}
              </Button>
              {!connected && (
                <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                  Preencha as credenciais abaixo e clique aqui
                </Typography>
              )}
            </Box>
          </Box>

          {connected && (
            <Box>
              <InstagramAccountStatus profile={profile} error={error} />
              <Button
                variant="contained"
                color="primary"
                component="a"
                href="/instagram/posts"
                sx={{ mb: 2 }}
                startIcon={<InstagramIcon />}
              >
                View Instagram Posts & Interactions
              </Button>
            </Box>
          )}

          {!connected && (
            <Box sx={{ mt: 2 }}>
              {/* Add credential fields */}
              <Typography variant="subtitle1" gutterBottom>
                Credenciais do Instagram
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Para conectar sua conta do Instagram, preencha os campos abaixo com as credenciais do seu aplicativo Facebook Developer.
                    Todas as informações serão enviadas em uma única requisição quando você clicar em "Connect with Instagram".
                  </Typography>
                </Alert>
                
                <TextField
                  label="App ID"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
                
                <FormControl variant="outlined" fullWidth margin="normal">
                  <InputLabel htmlFor="app-secret-input">App Secret</InputLabel>
                  <OutlinedInput
                    id="app-secret-input"
                    type={showAppSecret ? 'text' : 'password'}
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleAppSecretVisibility}
                          edge="end"
                        >
                          {showAppSecret ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="App Secret"
                  />
                </FormControl>
                
                <FormControl variant="outlined" fullWidth margin="normal">
                  <InputLabel htmlFor="access-token-input">Token de Acesso</InputLabel>
                  <OutlinedInput
                    id="access-token-input"
                    type={showAccessToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle token visibility"
                          onClick={handleToggleAccessTokenVisibility}
                          edge="end"
                        >
                          {showAccessToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Token de Acesso"
                  />
                </FormControl>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Se você já possui um token de acesso do Instagram, pode inseri-lo diretamente no campo acima.
                  Caso contrário, preencha o App ID e App Secret e clique em "Conectar Instagram" para obter um novo token.
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstagramConnect;