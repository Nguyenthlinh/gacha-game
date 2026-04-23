using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Khởi tạo Database và Seed dữ liệu
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    using (var context = services.GetRequiredService<ApplicationDbContext>())
    {
        context.Database.OpenConnection();
        try {
            // Tạo bảng Classrooms nếu chưa có
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Classrooms"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" TEXT NOT NULL
                );
            ");
            // Tạo bảng Students nếu chưa có
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Students"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" TEXT NOT NULL,
                    ""Stickers"" INTEGER DEFAULT 0,
                    ""ClassroomId"" INTEGER DEFAULT 0
                );
            ");
        } finally {
            context.Database.CloseConnection();
        }
    }
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
