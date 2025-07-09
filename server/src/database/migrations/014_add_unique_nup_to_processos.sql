-- Migration: Adiciona restrição UNIQUE ao campo nup na tabela processos
ALTER TABLE processos
ADD CONSTRAINT processos_nup_unique UNIQUE (nup); 