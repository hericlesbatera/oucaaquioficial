<?php
session_start();
?>
<!DOCTYPE html>
<html lang="pt-br">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Barra de Progresso</title>
		<link href="css/bootstrap.css" rel="stylesheet">
	</head>
	<body>
		<div class="container">
			<h1>Cadastrar Imagem</h1>
			<?php
			if(isset($_SESSION['msg'])){
				echo $_SESSION['msg'];
				unset($_SESSION['msg']);
			}
			?>
			<hr>
			<form action="#" class="form-horizontal"> 
				<div class="form-group">
					<label class="col-sm-2 control-label">Titulo</label>
					<div class="col-sm-10">
						<input type="text" name="titulo" class="form-control" placeholder="Digite o titulo">
					</div>
				</div>
				
				<div class="form-group">
					<label class="col-sm-2 control-label">Imagem</label>
					<div class="col-sm-10">
						<input type="file" name="arquivo" class="form-control">
					</div>
				</div>
				
				<div class="form-group">
					<label class="col-sm-2 control-label"></label>
					<div class="col-sm-10">
						<div class="progress progress-striped active">
							<div class="progress-bar" style="width: 0%">
							</div>
						</div>
					</div>
				</div>
				
				<div class="form-group">
					<div class="col-sm-offset-2 col-sm-10">
						<button type="submit" class="btn btn-success upload">Cadastrar</button>
					</div>
				</div>
			</form>
		</div>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
		<script src="js/bootstrap.min.js"></script>
		<script>
			$(document).on('submit', 'form', function (e) {
				e.preventDefault();
				//Receber os dados
				$form = $(this);				
				var formdata = new FormData($form[0]);
				
				//Criar a conexao com o servidor
				var request = new XMLHttpRequest();
				
				//Progresso do Upload
				request.upload.addEventListener('progress', function (e) {
					var percent = Math.round(e.loaded / e.total * 100);
					$form.find('.progress-bar').width(percent + '%').html(percent + '%');
				});
				
				//Upload completo limpar a barra de progresso
				request.addEventListener('load', function(e){
					$form.find('.progress-bar').addClass('progress-bar-success').html('upload completo...');
					//Atualizar a página após o upload completo
					setTimeout("window.open(self.location, '_self');", 1000);
				});
				
				//Arquivo responsável em fazer o upload da imagem
				request.open('post', 'processa.php');
				request.send(formdata);
			});
		</script>
	</body>
</html>