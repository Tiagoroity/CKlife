-- CK Life · TIME DE INCENTIVO: fotos de capa (img/equipe/capa-NN.jpg, mesma ordem dos nomes)
-- Seguro rodar mais de uma vez. As capas 37 a 40 ficam com a capa padrão até chegarem.
do $$ begin
  perform set_config('ck.sistema', '1', true);
  update perfis p set capa = 'img/equipe/capa-' || lpad(x.ord::text, 2, '0') || '.jpg'
  from unnest(array['Ana Clara Souza','Beatriz Lima','Camila Rocha','Daniela Martins','Eduarda Alves','Fernanda Costa','Gabriela Nunes','Helena Ribeiro','Isabela Moraes','Júlia Ferreira',
    'Larissa Gomes','Mariana Dias','Natália Barros','Olívia Castro','Paula Mendes','Rafaela Pinto','Sofia Carvalho','Tatiane Freitas','Valentina Duarte','Vitória Araújo',
    'Alice Monteiro','Bruna Teixeira','Carolina Lopes','Débora Vieira','Elisa Cardoso','Flávia Ramos','Giovana Pires','Heloísa Batista','Ingrid Correia','Jéssica Moura',
    'Karina Farias','Letícia Rezende','Manuela Azevedo','Nicole Fonseca','Priscila Campos','Renata Siqueira','Sabrina Prado','Thaís Andrade','Vanessa Brito','Yasmin Leal',
    'Amanda Cunha','Bianca Tavares','Cecília Macedo','Diana Queiroz','Estela Peixoto','Fabiana Rangel','Graziela Torres','Joana Pacheco','Lívia Bastos','Marina Coelho']) with ordinality as x(nome, ord), equipe_membros m
  where m.nome = x.nome and p.user_id = m.user_id and x.ord not in (37, 38, 39, 40);
  perform set_config('ck.sistema', '0', true);
end $$;
