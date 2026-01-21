let dadosGlobais = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Página carregada');
    console.log('📍 Location:', window.location.href);
    console.log('🔧 Hostname:', window.location.hostname, 'Port:', window.location.port);

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'block';
    }

    // Em produção, usar o origin atual; em dev local do proxy (porta 8080), usar localhost:3001
    const isProxyLocal = window.location.hostname === 'localhost' && window.location.port === '8080';
    const defaultBaseUrl = isProxyLocal ? 'http://localhost:3001' : window.location.origin;
    
    const savedUrl = localStorage.getItem('baseUrl');
    const baseUrlInput = document.getElementById('baseUrl');
    if (baseUrlInput) {
        if (savedUrl) {
            baseUrlInput.value = savedUrl;
            console.log('💾 URL salva carregada:', savedUrl);
        } else {
            baseUrlInput.value = defaultBaseUrl;
            console.log('🌐 URL padrão configurada:', defaultBaseUrl);
        }
    }

    const fetchButton = document.getElementById('fetchButton');
    if (fetchButton) {
        fetchButton.addEventListener('click', buscarDados);
    }

    const downloadButton = document.getElementById('downloadButton');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadJSON);
    }

    console.log('⏳ Iniciando busca automática de token...');
    obterTokenAutomaticamente().then((sucesso) => {
        console.log('🏁 Resultado da busca automática:', sucesso ? 'Sucesso' : 'Falhou');
    });
});

async function obterTokenAutomaticamente() {
    const baseUrlInput = document.getElementById('baseUrl');
    const tokenGroup = document.getElementById('tokenGroup');
    const tokenField = document.getElementById('apiToken');
    
    // Em produção, usar sempre o origin atual para buscar o token (mesma origem = cookies funcionam)
    const isProxyLocal = window.location.hostname === 'localhost' && window.location.port === '8080';
    const defaultBaseUrl = isProxyLocal ? 'http://localhost:3001' : window.location.origin;
    const baseUrl = (baseUrlInput?.value || defaultBaseUrl).trim();

    console.log('🔐 Tentando obter token automaticamente...');
    console.log('📍 Base URL:', baseUrl);
    console.log('🌍 Origin atual:', window.location.origin);
    console.log('🔧 Ambiente:', isProxyLocal ? 'Proxy Local (8080)' : 'Produção/Server');

    try {
        // Se estamos no servidor/produção (não proxy local), usar caminho relativo para garantir same-origin
        const usarCaminhoRelativo = !isProxyLocal;
        const tokenUrl = usarCaminhoRelativo ? '/api/auth/token' : '/api/auth/token';

        console.log('🌐 URL de token:', tokenUrl);
        console.log('🔧 Caminho relativo:', usarCaminhoRelativo);

        const response = await fetch(tokenUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Resposta recebida:', { hasToken: !!data.token, hasUser: !!data.user });

            if (data.token && tokenField) {
                tokenField.value = data.token;
                console.log('✅ Token configurado automaticamente');

                if (tokenGroup) {
                    tokenGroup.style.display = 'none';
                }

                const userEmail = data.user?.email || data.user?.primeiro_nome || 'Usuário do Sistema';
                mostrarStatus(`✅ Autenticado como: ${userEmail}`, 'success');
                return true;
            }

            console.warn('⚠️ Token não encontrado na resposta');
        } else {
            console.warn('⚠️ Response não OK:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Erro ao obter token automaticamente:', error);
    }

    console.log('⚠️ Exibindo campo de token manual');
    if (tokenGroup) {
        tokenGroup.style.display = 'flex';
    }
    mostrarStatus('⚠️ Cole o token JWT manualmente ou faça login no Sistema Supel', 'error');
    return false;
}

async function buscarDados() {
    const baseUrlInput = document.getElementById('baseUrl');
    const tokenField = document.getElementById('apiToken');
    const limitField = document.getElementById('limit');

    const baseUrl = baseUrlInput?.value.trim();
    const token = tokenField?.value.trim();
    const limit = limitField?.value || 1000;

    if (!baseUrl) {
        mostrarStatus('❌ Por favor, informe a URL base', 'error');
        return;
    }

    if (!token) {
        mostrarStatus('❌ Por favor, informe o token JWT', 'error');
        return;
    }

    const status = document.getElementById('status');
    if (status) {
        status.style.display = 'flex';
        status.className = 'status loading';
        status.innerHTML = '<div class="spinner"></div><span>Buscando dados...</span>';
    }

    try {
        const isProxyLocal = window.location.hostname === 'localhost' && window.location.port === '8080';
        const params = `?rp=true&conclusao=true&limit=${limit}&page=1&sort=data_entrada&order=desc`;
        // Em produção ou no servidor, sempre usar caminho relativo; no proxy local, também relativo
        const url = `/api/processes${params}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        const tableContainer = document.getElementById('tableContainer');
        const noData = document.getElementById('noData');
        const stats = document.getElementById('stats');

        if (response.status === 401) {
            mostrarStatus('❌ Token inválido ou expirado. Verifique o JWT', 'error');
            if (tableContainer) {
                tableContainer.style.display = 'none';
            }
            if (noData) {
                noData.style.display = 'block';
            }
            if (stats) {
                stats.innerHTML = '';
            }
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        dadosGlobais = data;

        if (!data.data || data.data.length === 0) {
            mostrarStatus('⚠️ Nenhum processo com RP=true E Conclusão=true encontrado', 'error');
            if (tableContainer) {
                tableContainer.style.display = 'none';
            }
            if (noData) {
                noData.style.display = 'block';
            }
            if (stats) {
                stats.innerHTML = '';
            }
            return;
        }

        exibirDados(data.data);
        mostrarStatus(`✅ ${data.data.length} processos carregados com sucesso!`, 'success');
        localStorage.setItem('baseUrl', baseUrl);
        localStorage.setItem('apiToken', token);
    } catch (error) {
        mostrarStatus(`❌ Erro: ${error.message}`, 'error');
        const tableContainer = document.getElementById('tableContainer');
        const noData = document.getElementById('noData');
        const stats = document.getElementById('stats');
        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
        if (noData) {
            noData.style.display = 'block';
        }
        if (stats) {
            stats.innerHTML = '';
        }
        console.error('Erro:', error);
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function exibirDados(processos) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    let totalValor = 0;

    processos.forEach((p) => {
        const valor = parseFloat(p.valor_realizado) || 0;
        totalValor += valor;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="nup">${p.nup}</td>
            <td class="objeto" title="${p.objeto}">${p.objeto}</td>
            <td><span class="badge">${p.unidade_gestora?.sigla || 'N/A'}</span></td>
            <td class="modalidade">${p.modalidade?.sigla_modalidade || 'N/A'}</td>
            <td>${p.numero_ano}</td>
            <td class="valor">${formatarMoeda(valor)}</td>
        `;
        tbody.appendChild(row);
    });

    const tableContainer = document.getElementById('tableContainer');
    const noData = document.getElementById('noData');
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
    if (noData) {
        noData.style.display = 'none';
    }

    const stats = document.getElementById('stats');
    if (stats) {
        const statsHtml = `
            <div class="stat-card">
                <div class="stat-label">Total de Processos</div>
                <div class="stat-value">${processos.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Valor Total Realizado</div>
                <div class="stat-value">${formatarMoeda(totalValor)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Filtros Ativos</div>
                <div class="stat-value" style="font-size: 14px;">
                    RP ✓ + Conclusão ✓
                </div>
            </div>
        `;

        stats.innerHTML = statsHtml;
    }
}

function mostrarStatus(mensagem, tipo) {
    const status = document.getElementById('status');
    if (!status) {
        return;
    }

    status.style.display = 'flex';
    status.className = `status ${tipo}`;
    status.innerHTML = `<span>${mensagem}</span>`;

    if (tipo === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

function downloadJSON() {
    if (!dadosGlobais) {
        mostrarStatus('❌ Nenhum dado para download', 'error');
        return;
    }

    const processosFormatados = dadosGlobais.data.map((p) => ({
        nup: p.nup,
        objeto: p.objeto,
        ug: p.unidade_gestora?.sigla || 'N/A',
        modalidade: p.modalidade?.sigla_modalidade || 'N/A',
        numero_ano: p.numero_ano,
        situacao: p.situacao?.nome_situacao || 'N/A',
        valor_realizado: parseFloat(p.valor_realizado) || 0,
        rp: true,
        conclusao: true
    }));

    const saida = {
        success: true,
        count: processosFormatados.length,
        filtros: {
            rp: true,
            conclusao: true
        },
        data: processosFormatados,
        timestamp: new Date().toISOString(),
        descricao: 'Processos com Registro de Preço (RP=true) e Concluídos (Conclusão=true)'
    };

    const jsonString = JSON.stringify(saida, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processos_rp_conclusao_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    mostrarStatus(`✅ Download de ${processosFormatados.length} processos iniciado!`, 'success');
}
