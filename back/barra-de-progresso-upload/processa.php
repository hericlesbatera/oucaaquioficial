<?php
session_start();
include_once('conexao.php');

//Receber os dados do formulário
$tmp_name = $_FILES['arquivo']['tmp_name'];
$name = $_FILES['arquivo']['name'];
$titulo = $_POST['titulo'];

//Fazer o Upload
move_uploaded_file($tmp_name, 'documento/'. $name);

//Salvar no BD
$result_imagem = "INSERT INTO imagens (nome_imagem, titulo) VALUES ('$name', '$titulo')";
$resultado_imagem = mysqli_query($conn, $result_imagem);

if(mysqli_insert_id($conn)){
	$_SESSION['msg'] = "<div class='alert alert-success'>Imagem cadastrada com sucesso!</div>";
}else{
	$_SESSION['msg'] = "<div class='alert alert-danger'>Erro ao cadastrada a imagem!</div>";
}