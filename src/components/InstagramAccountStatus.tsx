import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowRight as ArrowRightIcon,
  BugReport as BugReportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface InstagramAccountStatusProps {
  profile: any; // Raw Instagram profile data
  error: string | null;
}

const InstagramAccountStatus: React.FC<InstagramAccountStatusProps> = ({ profile, error }) => {
  const [debugMode, setDebugMode] = useState(false);
  const [forceConnected, setForceConnected] = useState(false);
  
  // Enhanced business account detection with multiple checks
  const hasBusinessAccount = forceConnected || (profile && (
    // Direct ID check
    profile.id || 
    // Check in rawPageResponses for connected accounts
    (profile.rawPageResponses && profile.rawPageResponses.some((page: any) =>
      page.instagram_business_account || 
      page.connected_instagram_account ||
      // Additional checks for other possible structures
      (page.instagram_accounts && page.instagram_accounts.data && page.instagram_accounts.data.length > 0) ||
      (page.instagram && page.instagram.id)
    )) ||
    // Check if username exists which might indicate a connected account
    (profile.username && profile.accessToken)
  ));
  
  // Check if we have Facebook pages but no Instagram business account
  const hasPages = profile && 
    profile.rawAccountsResponse && 
    profile.rawAccountsResponse.data && 
    profile.rawAccountsResponse.data.length > 0;
  
  // Helper function to format JSON for display
  const formatJSON = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return 'Unable to format JSON';
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Debug Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={<Switch checked={debugMode} onChange={(e) => setDebugMode(e.target.checked)} />}
          label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BugReportIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">Modo de Diagnóstico</Typography>
          </Box>}
        />
        
        {profile && !hasBusinessAccount && (
          <FormControlLabel
            control={<Switch checked={forceConnected} onChange={(e) => setForceConnected(e.target.checked)} />}
            label={<Typography variant="body2">Forçar Conexão (Teste)</Typography>}
          />
        )}
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Erro de Conexão</AlertTitle>
          {error}
        </Alert>
      ) : hasBusinessAccount ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Conectado com Sucesso</AlertTitle>
          {forceConnected ? 
            'Modo de teste: Simulando conexão bem-sucedida com a conta comercial do Instagram.' :
            'Sua conta comercial do Instagram está conectada com sucesso.'}
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Conta Comercial do Instagram Necessária</AlertTitle>
          <Typography variant="body2" paragraph>
            Você se autenticou com sucesso no Facebook, mas nenhuma conta comercial do Instagram foi encontrada.
          </Typography>
          
          {hasPages ? (
            <Typography variant="body2">
              Você tem {profile.rawAccountsResponse.data.length} página(s) do Facebook, mas nenhuma delas tem uma conta comercial do Instagram conectada.
            </Typography>
          ) : (
            <Typography variant="body2">
              Nenhuma página do Facebook foi encontrada na sua conta. Você precisa de pelo menos uma página do Facebook para conectar uma conta comercial do Instagram.
            </Typography>
          )}
        </Alert>
      )}
      
      {!hasBusinessAccount && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Como Conectar uma Conta Comercial do Instagram
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Passo 1: Criar uma Página do Facebook" 
                secondary="Se você não tem uma Página do Facebook, crie uma em facebook.com/pages/create"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Passo 2: Converter sua conta do Instagram para uma conta comercial" 
                secondary="Abra o app do Instagram > Perfil > Menu > Configurações > Conta > Mudar para Conta Profissional > Empresa"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Passo 3: Vincular sua conta comercial do Instagram à sua Página do Facebook" 
                secondary="No app do Instagram > Perfil > Editar Perfil > Página > Selecione sua Página do Facebook"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Passo 4: Tente conectar novamente" 
                secondary="Depois de completar esses passos, tente conectar sua conta do Instagram novamente"
              />
            </ListItem>
          </List>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Para instruções mais detalhadas, visite o{' '}
            <Link href="https://help.instagram.com/502981923235522" target="_blank" rel="noopener">
              Centro de Ajuda do Instagram
            </Link>
          </Typography>
        </Paper>
      )}
      
      {profile && (
        <>
          <Accordion defaultExpanded={debugMode}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Detalhes Técnicos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" gutterBottom>Status do Token de Acesso:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {profile.accessToken ? 'Token de acesso recebido' : 'Sem token de acesso'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Páginas do Facebook:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {hasPages ? `${profile.rawAccountsResponse.data.length} página(s) encontrada(s)` : 'Nenhuma página do Facebook encontrada'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Conta Comercial do Instagram:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {hasBusinessAccount && !forceConnected ? `ID: ${profile.id}` : 'Nenhuma conta comercial do Instagram encontrada'}
              </Typography>

              {profile.username && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Nome de Usuário:</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {profile.username}
                  </Typography>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Debug Information Section */}
          {debugMode && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informações de Diagnóstico
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Estrutura de Dados Completa:</Typography>
                <Box 
                  component="pre"
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '0.75rem'
                  }}
                >
                  {formatJSON(profile)}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Páginas do Facebook:</Typography>
                {hasPages ? (
                  <Box>
                    {profile.rawAccountsResponse.data.map((page: any, index: number) => (
                      <Card key={index} sx={{ mb: 2, p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Página {index + 1}: {page.name}
                        </Typography>
                        <Typography variant="body2">
                          ID: {page.id}
                        </Typography>
                        <Typography variant="body2">
                          Categoria: {page.category || 'N/A'}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">Nenhuma página do Facebook encontrada</Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Respostas das Páginas (Instagram):</Typography>
                {profile.rawPageResponses && profile.rawPageResponses.length > 0 ? (
                  <Box>
                    {profile.rawPageResponses.map((pageResponse: any, index: number) => (
                      <Card key={index} sx={{ mb: 2, p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Resposta da Página {index + 1}:
                        </Typography>
                        <Typography variant="body2">
                          Conta de Negócios do Instagram: {pageResponse.instagram_business_account ? 'Sim' : 'Não'}
                        </Typography>
                        <Typography variant="body2">
                          Conta do Instagram Conectada: {pageResponse.connected_instagram_account ? 'Sim' : 'Não'}
                        </Typography>
                        {pageResponse.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            Erro ao obter informações: {pageResponse.error.message || 'Erro desconhecido'}
                          </Alert>
                        )}
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">Nenhuma resposta de página com informações do Instagram</Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Solução de Problemas</Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Dicas para Resolver Problemas de Conexão</AlertTitle>
                  <Typography variant="body2">
                    1. Verifique se sua conta do Instagram está configurada como conta comercial ou de criador.
                  </Typography>
                  <Typography variant="body2">
                    2. Confirme se sua conta do Instagram está vinculada à sua página do Facebook.
                  </Typography>
                  <Typography variant="body2">
                    3. Tente desconectar e reconectar sua conta.
                  </Typography>
                  <Typography variant="body2">
                    4. Verifique se você concedeu todas as permissões necessárias durante a autenticação.
                  </Typography>
                </Alert>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<RefreshIcon />}
                  fullWidth
                  onClick={() => window.location.reload()}
                >
                  Recarregar e Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

// Remove duplicate export since it's already exported at the end of the file
   

export default InstagramAccountStatus;